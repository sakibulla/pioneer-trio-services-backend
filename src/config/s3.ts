import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { env } from './env';
import { logger } from './logger';

export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT || undefined,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export const initializeS3Buckets = async (): Promise<void> => {
  const buckets = [env.S3_BUCKET_DOCUMENTS, env.S3_BUCKET_PHOTOS];

  for (const bucket of buckets) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      logger.info(`📦 S3 Bucket "${bucket}" is ready`);
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        try {
          await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
          logger.info(`📦 Created S3 Bucket "${bucket}" successfully`);
        } catch (createErr: any) {
          logger.warn(`Could not create S3 bucket "${bucket}". Please verify permissions`, { error: createErr.message });
        }
      } else {
        logger.warn(`S3 HeadBucket check failed for "${bucket}"`, { error: err.message });
      }
    }
  }
};

export const checkS3Health = async (): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET_DOCUMENTS }));
    return { status: 'healthy' };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
};
