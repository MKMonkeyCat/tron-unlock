import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Orchestrates the extension dev loop: the reload server (scripts/dev-reload-server.mjs)
// plus a nodemon watcher that rebuilds and pings it. Plain Node child_process
// instead of a shell one-liner so quoting/`&&` chains stay identical on
// Windows and POSIX shells.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const nodemonBin = path.join(
  root,
  'node_modules',
  'nodemon',
  'bin',
  'nodemon.js',
);

const server = spawn(process.execPath, ['scripts/dev-reload-server.mjs'], {
  cwd: root,
  stdio: 'inherit',
});

// Invoke nodemon's JS entry directly with process.execPath rather than the
// .cmd/.sh shim - avoids needing shell:true (and its arg-escaping footgun)
// just to resolve the platform-specific wrapper script.
const watcher = spawn(
  process.execPath,
  [
    nodemonBin,
    '-w',
    'extension',
    '-w',
    'src',
    '-w',
    'manifest.config.ts',
    '-w',
    'vite.config.extension.ts',
    '--ext',
    'tsx,css,html,ts,json,scss',
    '--exec',
    'vite build --mode development --config vite.config.extension.ts && node scripts/dev-notify.mjs',
  ],
  { cwd: root, stdio: 'inherit' },
);

let shuttingDown = false;
const shutdown = (code) => {
  if (shuttingDown) return;
  shuttingDown = true;
  server.kill();
  watcher.kill();
  process.exit(code ?? 0);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
watcher.on('exit', (code) => shutdown(code));
server.on('exit', (code) => shutdown(code));
