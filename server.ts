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
      console.log(`[Webhook Proxy] Forwarding request to Make.com: ${webhookUrl}`);
      console.log(`[Webhook Proxy] Payload state: ${req.body?.state}`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'A1Toque-App/1.0',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.text();
      console.log(`[Webhook Proxy] Make.com response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[Webhook Proxy] Error from Make.com: ${response.status} - ${data}`);
        return res.status(response.status).send(data);
      }

      // Forward the content type if possible, or default to text/plain
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      res.send(data);
    } catch (error) {
      console.error("[Webhook Proxy] Critical error:", error);
      res.status(500).json({ 
        error: "Failed to reach webhook", 
        details: error instanceof Error ? error.message : String(error) 
      });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
