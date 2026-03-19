import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookUrl = "https://hook.us1.make.com/k1ju5hoo957qi7tasocjdpcso23egosw";
  
  try {
    console.log(`[Webhook Proxy] Forwarding request to Make.com: ${webhookUrl}`);
    
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
}
