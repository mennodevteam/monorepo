import { S3 } from 'aws-sdk';

export const awsConfig: S3.ClientConfiguration = {
  endpoint: `https://${process.env.LIARA_BUCKET_ENDPOINT}`,
  accessKeyId: process.env.LIARA_ACCESS_KEY,
  secretAccessKey: process.env.LIARA_SECRET_KEY,
  region: 'default',
  s3ForcePathStyle: true,
}