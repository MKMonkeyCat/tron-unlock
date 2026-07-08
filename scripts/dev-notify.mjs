// Called after each successful `vite build --mode development` by the
// dev:extension watcher. Best-effort: the server may not be up yet on the
// very first build, that's fine, the extension's initial tab-reload only
// matters for changes made *after* it has connected once.
try {
  await fetch('http://127.0.0.1:5680/notify', { method: 'POST' });
} catch {
  // dev-reload server not running - ignore
}
