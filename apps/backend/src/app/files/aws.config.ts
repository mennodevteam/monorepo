import { S3 } from 'aws-sdk';

/** Full URL, e.g. https://storage.iran.liara.space (Liara docs: LIARA_ENDPOINT) */
function normalizeLiaraEndpoint(): string | undefined {
  let raw = (process.env.LIARA_ENDPOINT || '').trim();
  if (!raw) {
    const bucketEndpoint = (process.env.LIARA_BUCKET_ENDPOINT || '').trim();
    if (bucketEndpoint && (bucketEndpoint.includes('liara.space') || bucketEndpoint.includes('liara.ir'))) {
      raw = bucketEndpoint;
    } else {
      raw = 'storage.iran.liara.space';
    }
  }
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }
  return `https://${withoutTrailingSlash}`;
}

/**
 * Liara Object Storage (S3-compatible). Trims credentials — trailing newlines in
 * .env often cause SignatureDoesNotMatch. Supports LIARA_ENDPOINT (full URL) or
 * LIARA_BUCKET_ENDPOINT (host only), per Liara docs.
 */
export function getLiaraS3ClientConfiguration(): S3.ClientConfiguration {
  return {
    endpoint: normalizeLiaraEndpoint(),
    accessKeyId: process.env.LIARA_ACCESS_KEY?.trim(),
    secretAccessKey: process.env.LIARA_SECRET_KEY?.trim(),
    region: (process.env.LIARA_REGION || 'default').trim(),
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  };
}
