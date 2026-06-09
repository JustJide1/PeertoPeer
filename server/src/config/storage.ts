import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export const storageConfig = {
  driver: env.storage.driver,
  local: {
    directory: UPLOAD_DIR,
    publicPath: '/uploads',
  },
  s3: env.storage.s3,
};

if (storageConfig.driver === 'local') {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Resolves the public URL for an uploaded file's storage key/filename.
 *
 * Local driver: files live on disk under UPLOAD_DIR and are served through the
 * authenticated `/api/resources/:id/download` endpoint.
 *
 * S3 stub: in production, replace this with an upload to `storageConfig.s3.bucket`
 * via `@aws-sdk/client-s3` (PutObjectCommand) and return the resulting object URL
 * (or store just the object key and generate signed GET URLs on download).
 */
export function buildFileUrl(storageKey: string): string {
  if (storageConfig.driver === 's3') {
    return `https://${storageConfig.s3.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${storageKey}`;
  }

  return `${storageConfig.local.publicPath}/${storageKey}`;
}
