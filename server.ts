import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Proxy route for Make.com webhook to avoid CORS issues
  app.post("/api/webhook/publish", async (req, res) => {
    const webhookUrl = "https://hook.us1.make.com/k1ju5hoo957qi7tasocjdpcso23egosw";
    
    try {
      console.log("Proxying request to Make.com...", JSON.stringify({
        state: req.body.state,
        postType: req.body.postType,
        title: req.body.title?.substring(0, 20) + "..."
      }));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.text();
      console.log(`Make.com response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Webhook error: ${response.status} - ${data}`);
        return res.status(response.status).send(data);
      }

      // If it's a 'create' state, we expect a URL in the response
      if (req.body.state === 'create') {
        console.log("Generated image URL received from Make.com:", data.substring(0, 50) + "...");
      }

      res.send(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to reach webhook", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
