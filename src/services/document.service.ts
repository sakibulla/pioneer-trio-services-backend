import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import { encryptBuffer, decryptBuffer } from '../utils/encryption';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/appError';
import { logger } from '../config/logger';

class DocumentService {
  /**
   * Encrypt and store document in S3/MinIO
   */
  public async uploadEncryptedDocument(
    caseId: string,
    documentType: string,
    file: Express.Multer.File
  ) {
    const fileId = uuidv4();
    const extension = file.originalname.split('.').pop() || 'bin';
    const storageKey = `cases/${caseId}/${documentType}_${fileId}.${extension}.enc`;

    // Encrypt payload with AES-256-GCM
    const { iv, tag, encryptedData } = encryptBuffer(file.buffer);

    // Upload encrypted binary to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_DOCUMENTS,
        Key: storageKey,
        Body: encryptedData,
        ContentType: 'application/octet-stream',
        Metadata: {
          'x-pioneer-iv': iv,
          'x-pioneer-tag': tag,
          'x-pioneer-mime': file.mimetype,
          'x-pioneer-orig-name': encodeURIComponent(file.originalname),
        },
      })
    );

    // Save metadata record in PostgreSQL
    const documentRecord = await prisma.caseDocument.create({
      data: {
        caseId,
        documentType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageKey,
        encrypted: true,
        encryptionIv: `${iv}:${tag}`,
      },
    });

    logger.info(`Uploaded and encrypted document [${documentType}] for case ${caseId}`);
    return documentRecord;
  }

  /**
   * Generate secure presigned URL or decrypted buffer
   */
  public async getDecryptedDocument(documentId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const doc = await prisma.caseDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundError('Document not found');

    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_DOCUMENTS,
        Key: doc.storageKey,
      })
    );

    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };

    const encryptedData = await streamToBuffer(s3Response.Body);

    if (doc.encrypted && doc.encryptionIv) {
      const [iv, tag] = doc.encryptionIv.split(':');
      const decrypted = decryptBuffer(encryptedData, iv, tag);
      return { buffer: decrypted, fileName: doc.fileName, mimeType: doc.mimeType };
    }

    return { buffer: encryptedData, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  /**
   * Generate temporary presigned URL for direct download
   */
  public async getPresignedDownloadUrl(documentId: string, expiresIn = 300): Promise<{ url: string; fileName: string }> {
    const doc = await prisma.caseDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundError('Document not found');

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_DOCUMENTS,
      Key: doc.storageKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, fileName: doc.fileName };
  }

  /**
   * Delete document physically and logically
   */
  public async deleteDocument(documentId: string): Promise<void> {
    const doc = await prisma.caseDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundError('Document not found');

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET_DOCUMENTS,
          Key: doc.storageKey,
        })
      );
    } catch (err: any) {
      logger.warn(`Could not delete object ${doc.storageKey} from S3`, { error: err.message });
    }

    await prisma.caseDocument.delete({ where: { id: documentId } });
  }

  /**
   * Upload Profile Photo (Optimized & WebP)
   */
  public async uploadPhoto(profileId: string, displayOrder: number, optimizedBuffer: Buffer, thumbnailBuffer: Buffer, originalName: string) {
    const photoId = uuidv4();
    const storageKey = `photos/${profileId}/photo_${displayOrder}_${photoId}.webp`;
    const thumbnailKey = `photos/${profileId}/thumb_${displayOrder}_${photoId}.webp`;

    // Upload optimized full size
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_PHOTOS,
        Key: storageKey,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
      })
    );

    // Upload thumbnail
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_PHOTOS,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/webp',
      })
    );

    // Upsert photo record (ensuring displayOrder 1 or 2 constraint)
    const photo = await prisma.profilePhoto.upsert({
      where: {
        profileId_displayOrder: {
          profileId,
          displayOrder,
        },
      },
      update: {
        fileName: originalName,
        fileSize: optimizedBuffer.length,
        mimeType: 'image/webp',
        storageKey,
        thumbnailKey,
        verified: false,
      },
      create: {
        profileId,
        fileName: originalName,
        fileSize: optimizedBuffer.length,
        mimeType: 'image/webp',
        storageKey,
        thumbnailKey,
        displayOrder,
        verified: false,
      },
    });

    return photo;
  }
}

export const documentService = new DocumentService();
