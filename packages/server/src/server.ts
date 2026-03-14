import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

import { AgentServer } from './agentServer.js';

export interface ServerOptions {
  port: number;
  watchPath: string;
}

export function createPixelAgentsServer(options: ServerOptions) {
  const { port, watchPath } = options;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const app = express();
  const httpServer = createServer(app);

  // Serve frontend static files
  const webDistPath = path.join(__dirname, '..', '..', 'web', 'dist');
  app.use(express.static(webDistPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });

  // WebSocket
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const agentServer = new AgentServer(watchPath);

  wss.on('connection', (ws) => {
    console.log('[pixel-agents-web] Browser connected');
    agentServer.addClient(ws);
  });

  httpServer.listen(port, () => {
    console.log(`[pixel-agents-web] Running at http://localhost:${port}`);
    console.log(`[pixel-agents-web] Watching: ${watchPath}`);
  });

  return { httpServer, agentServer };
}
