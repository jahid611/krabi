import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import type { ClientMessage, ServerMessage } from '@krabi/shared';
import { Store } from './store.js';
import { loadSettings, saveSettings } from './settings.js';
import { LcuWatcher } from './lcu/watcher.js';
import { LivePoller } from './live/poller.js';
import { Simulator } from './sim/simulator.js';

const PORT = Number(process.env.PORT ?? 4600);
const WEB_DIST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

const store = new Store();
store.setSettings(loadSettings());

const watcher = new LcuWatcher(store);
const poller = new LivePoller(store);
const simulator = new Simulator(store);

watcher.start();
poller.start();
simulator.setEnabled(store.getSettings().demoMode);
setInterval(() => store.prune(), 5000);

/* ---- helpers HTTP ---- */

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) reject(new Error('body trop volumineux'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function applySettingsPatch(patch: unknown): void {
  const settings = store.patchSettings((patch ?? {}) as any);
  saveSettings(settings);
  simulator.setEnabled(settings.demoMode);
}

function startTimerFromMessage(msg: Extract<ClientMessage, { type: 'startTimer' }>): void {
  if (!msg.refKey || !Number.isFinite(msg.durationMs) || msg.durationMs <= 0) return;
  store.startTimer({
    kind: msg.kind,
    refKey: msg.refKey,
    label: msg.label ?? msg.refKey,
    durationMs: Math.min(msg.durationMs, 30 * 60 * 1000),
    auto: false,
  });
}

/* ---- serveur HTTP : API + build web en production ---- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;

  try {
    if (path === '/api/state' && req.method === 'GET') {
      return sendJson(res, 200, store.snapshot());
    }
    if (path === '/api/settings' && req.method === 'GET') {
      return sendJson(res, 200, store.getSettings());
    }
    if (path === '/api/settings' && (req.method === 'PUT' || req.method === 'PATCH')) {
      applySettingsPatch(await readBody(req));
      return sendJson(res, 200, store.getSettings());
    }
    if (path === '/api/timers' && req.method === 'POST') {
      const body = await readBody(req);
      startTimerFromMessage({ type: 'startTimer', ...body });
      return sendJson(res, 200, { ok: true });
    }
    if (path.startsWith('/api/timers/') && req.method === 'DELETE') {
      store.cancelTimer(decodeURIComponent(path.slice('/api/timers/'.length)));
      return sendJson(res, 200, { ok: true });
    }
    if (path.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'route inconnue' });
    }

    // statique (build de prod) avec fallback SPA
    if (existsSync(WEB_DIST)) {
      let filePath = normalize(join(WEB_DIST, path === '/' ? 'index.html' : path));
      if (!filePath.startsWith(WEB_DIST)) {
        res.writeHead(403);
        return res.end();
      }
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        filePath = join(WEB_DIST, 'index.html');
      }
      const type = MIME[extname(filePath)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      return res.end(readFileSync(filePath));
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('KRABI server — build web absent, utilise `npm run dev:web` en développement.');
  } catch (err) {
    sendJson(res, 500, { error: String(err) });
  }
});

/* ---- WebSocket : push d'état + actions client ---- */

const wss = new WebSocketServer({ server, path: '/ws' });

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

wss.on('connection', (ws) => {
  send(ws, { type: 'state', state: store.snapshot() });

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    switch (msg.type) {
      case 'startTimer':
        startTimerFromMessage(msg);
        break;
      case 'cancelTimer':
        store.cancelTimer(msg.refKey);
        break;
      case 'updateSettings':
        applySettingsPatch(msg.patch);
        break;
    }
  });
});

store.onChange((state) => {
  for (const client of wss.clients) send(client, { type: 'state', state });
});

server.listen(PORT, () => {
  console.log(`[krabi] serveur prêt sur http://localhost:${PORT} (ws: /ws)`);
  console.log(`[krabi] mode démo : ${store.getSettings().demoMode ? 'ON' : 'OFF'}`);
});
