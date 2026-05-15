// Minimal Express server used as a CI/CD target.
//   /health  — liveness/readiness probe, cheap and side-effect free
//   /version — returns the image tag injected at build time via env
//   /        — plain text greeting that includes the version
// Graceful shutdown on SIGTERM so K8s rolling updates don't drop in-flight traffic.

const express = require('express');

const app = express();
const port = Number(process.env.PORT) || 3000;
const version = process.env.APP_VERSION || 'dev';

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/version', (_req, res) => {
  res.status(200).json({ version });
});

app.get('/', (_req, res) => {
  res.status(200).send(`cloudfide-demo-api ${version}\n`);
});

const server = app.listen(port, () => {
  console.log(`listening on :${port} (version=${version})`);
});

function shutdown(signal) {
  console.log(`received ${signal}, draining connections`);
  server.close(() => process.exit(0));
  // hard stop after 10s in case sockets are stuck
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
