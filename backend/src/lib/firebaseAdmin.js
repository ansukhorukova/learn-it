const admin = require('firebase-admin');

// Firebase is used exclusively for Auth (see CLAUDE.md "Файлове сховище" —
// Storage is S3-compatible, not Firebase). GOOGLE_APPLICATION_CREDENTIALS
// points at the service-account JSON (bind-mounted read-only in
// docker-compose.yml locally; a Secret Manager-backed file in Cloud Run
// production — same env var name either way, no code change needed).
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

module.exports = admin;
