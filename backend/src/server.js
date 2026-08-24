const app = require('./app');
const storage = require('./lib/storage');

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

  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API listening on port ${PORT}`);
  });
}

start();
