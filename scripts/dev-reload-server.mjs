import { createServer } from 'node:http';

// Dev-only companion to `dev:extension`: the unpacked extension's service
// worker long-polls GET /wait, which we hold open until the watcher build
// finishes and hits POST /notify. A pending fetch keeps an MV3 service
// worker alive, so this doubles as the extension's "is dev mode running"
// heartbeat - no websocket/dep needed for that.
const PORT = 5680;
const HOST = '127.0.0.1';
const WAIT_TIMEOUT_MS = 20_000;

let waiters = [];

const flush = () => {
  for (const res of waiters) respondJson(res, { changed: true });
  waiters = [];
};

const respondJson = (res, body) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
};

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/wait') {
    const timer = setTimeout(() => {
      waiters = waiters.filter((w) => w !== res);
      respondJson(res, { changed: false });
    }, WAIT_TIMEOUT_MS);
    req.on('close', () => {
      clearTimeout(timer);
      waiters = waiters.filter((w) => w !== res);
    });
    waiters.push(res);
    return;
  }

  if (req.method === 'POST' && req.url === '/notify') {
    flush();
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`[dev-reload] listening on http://${HOST}:${PORT}`);
});
