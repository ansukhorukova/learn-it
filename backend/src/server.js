const http = require('http');
const app = require('./app');
const storage = require('./lib/storage');
const { attachWebSocketServer } = require('./ws/server');

const PORT = process.env.PORT || 4000;

// MinIO doesn't auto-create buckets (unlike some managed S3 setups) — make
// sure STORAGE_BUCKET exists before accepting traffic, so a fresh
// `docker compose up` doesn't fail every attachment upload with
// NoSuchBucket (US9). Logged, not fatal, if it fails: the rest of the API
// (boards/tasks, none of which touch storage) should still come up even if
// storage is temporarily unreachable.
async function start() {
  try {
    await storage.ensureBucket();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to ensure storage bucket exists on startup', err);
  }

  // US-029: WS is attached to this SAME http.Server/port rather than a
  // separate process — see ws/server.js's header comment for the full
  // rationale. This is the one place `docker-compose.yml` would need a new
  // service if that decision ever changed; it hasn't, so compose is
  // untouched by this pass (US-029 AC7).
  const server = http.createServer(app);
  attachWebSocketServer(server);

  server.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API listening on port ${PORT} (HTTP + WS at /ws)`);
  });
}

start();
