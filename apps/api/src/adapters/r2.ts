import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../lib/errors.js';
import { env, isR2Configured } from '../env.js';

const PRESIGN_EXPIRES_SECONDS = 3600;

let client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!isR2Configured()) return null;
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export function isR2Available(): boolean {
  return isR2Configured();
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  options?: { expiresIn?: number },
): Promise<string | null> {
  const s3 = getClient();
  if (!s3 || !env.R2_BUCKET_NAME) return null;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, {
    expiresIn: options?.expiresIn ?? PRESIGN_EXPIRES_SECONDS,
  });
}

export async function getPresignedDownloadUrl(
  key: string,
  options?: { expiresIn?: number },
): Promise<string | null> {
  const s3 = getClient();
  if (!s3 || !env.R2_BUCKET_NAME) return null;

  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, {
    expiresIn: options?.expiresIn ?? PRESIGN_EXPIRES_SECONDS,
  });
}

export async function getPresignedUploadUrlOrThrow(
  key: string,
  contentType: string,
  options?: { expiresIn?: number },
): Promise<string> {
  const url = await getPresignedUploadUrl(key, contentType, options);
  if (!url) {
    throw new AppError('SERVICE_DEGRADED', 'Almacenamiento de archivos no configurado');
  }
  return url;
}

export async function getPresignedDownloadUrlOrThrow(
  key: string,
  options?: { expiresIn?: number },
): Promise<string> {
  const url = await getPresignedDownloadUrl(key, options);
  if (!url) {
    throw new AppError('SERVICE_DEGRADED', 'Almacenamiento de archivos no configurado');
  }
  return url;
}
