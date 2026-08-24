const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// S3-compatible client (CLAUDE.md "Файлове сховище") — works identically
// against MinIO locally and Cloudflare R2 / Firebase Storage (Blaze) in
// production, purely via env vars (STORAGE_ENDPOINT/STORAGE_ACCESS_KEY/
// STORAGE_SECRET_KEY/STORAGE_BUCKET/STORAGE_FORCE_PATH_STYLE — already wired
// into docker-compose.yml, never invented here). `forcePathStyle` is
// required for MinIO (it doesn't support virtual-hosted-style bucket URLs
// out of the box); R2/S3 tolerate it too, so this one client config works
// unmodified in both environments. (STORAGE_PUBLIC_ENDPOINT, used only below
// for presigning reads, is the one addition beyond that fixed set — see its
// comment.)
const BUCKET = process.env.STORAGE_BUCKET;

const REGION = process.env.STORAGE_REGION || 'auto';
const FORCE_PATH_STYLE = process.env.STORAGE_FORCE_PATH_STYLE === 'true';
const CREDENTIALS = {
  accessKeyId: process.env.STORAGE_ACCESS_KEY,
  secretAccessKey: process.env.STORAGE_SECRET_KEY,
};

const client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: REGION,
  forcePathStyle: FORCE_PATH_STYLE,
  credentials: CREDENTIALS,
});

// Signed download URLs are handed to the *browser*, not used server-side —
// so they must be built against a host the browser can actually resolve.
// Locally that's not STORAGE_ENDPOINT: docker-compose sets it to
// `http://minio:9000` (the container-network hostname, correct for the BE's
// own PutObject/HeadBucket calls above) which a browser on the host machine
// can't resolve at all. STORAGE_PUBLIC_ENDPOINT is the browser-reachable
// equivalent (docker-compose sets it to `http://localhost:9000`, MinIO's
// published port) used ONLY for presigning reads — it defaults to
// STORAGE_ENDPOINT when unset, which is why this is a no-op in production
// against R2/Firebase Storage, where the configured endpoint already *is*
// publicly reachable and no override is needed. A second S3Client instance
// (same credentials/region/path-style, different endpoint) is required
// because the AWS SDK bakes the client's configured endpoint into the
// canonical request it signs — MinIO/S3 validate the signature against
// whatever Host the browser's actual GET request presents, so the URL's
// host has to be the one the browser will use, not the one the BE uses.
const PUBLIC_ENDPOINT = process.env.STORAGE_PUBLIC_ENDPOINT || process.env.STORAGE_ENDPOINT;
const presignClient =
  PUBLIC_ENDPOINT === process.env.STORAGE_ENDPOINT
    ? client
    : new S3Client({
        endpoint: PUBLIC_ENDPOINT,
        region: REGION,
        forcePathStyle: FORCE_PATH_STYLE,
        credentials: CREDENTIALS,
      });

// How long a generated download URL stays valid. Short-lived per CLAUDE.md
// ("BE... видає короткоживучий signed URL") — long enough for a browser to
// load an image preview or start a download after a list call, short enough
// that a URL leaked in logs/browser history isn't useful for long.
const SIGNED_URL_TTL_SECONDS = 15 * 60;

// MinIO doesn't auto-create buckets (unlike some managed S3 setups) — called
// once at backend startup (see src/server.js) so a fresh `docker compose up`
// doesn't fail every upload with NoSuchBucket. Idempotent: safe to call on
// every restart, a no-op once the bucket exists (in prod against R2/Firebase
// Storage the bucket is expected to already exist, so this is just a
// cheap existence check there).
async function ensureBucket() {
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchBucket') {
      await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
      return;
    }
    throw err;
  }
}

async function putObject(key, buffer, contentType) {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

async function deleteObject(key) {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// Short-lived signed GET URL — this is how the FE reads a file attachment's
// bytes (thumbnail preview, download) without ever talking to storage
// directly per CLAUDE.md's architecture: the BE is what calls the S3 SDK,
// the FE only ever receives a URL from a BE JSON response.
async function getSignedDownloadUrl(key, filename) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ...(filename
      ? { ResponseContentDisposition: `inline; filename="${encodeURIComponent(filename)}"` }
      : {}),
  });
  return getSignedUrl(presignClient, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}

module.exports = { BUCKET, ensureBucket, putObject, deleteObject, getSignedDownloadUrl };
