import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MediaUploadRequest, MediaUploadResponse } from '../types/content';

const s3Client = new S3Client({});

const MEDIA_BUCKET = process.env.MEDIA_BUCKET_NAME || 'quranic-vocab-media';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

export class S3MediaService {
  
  async generateUploadUrl(request: MediaUploadRequest): Promise<MediaUploadResponse> {
    const key = this.generateMediaKey(request.wordId, request.mediaType, request.fileName);
    
    const command = new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      ContentType: request.contentType,
      Metadata: {
        wordId: request.wordId,
        mediaType: request.mediaType,
        originalFileName: request.fileName
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    const mediaUrl = this.getMediaUrl(key);

    return {
      uploadUrl,
      mediaUrl
    };
  }

  async deleteMedia(wordId: string, mediaType: string, fileName: string): Promise<void> {
    const key = this.generateMediaKey(wordId, mediaType, fileName);
    
    const command = new DeleteObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key
    });

    await s3Client.send(command);
  }

  async deleteAllWordMedia(wordId: string): Promise<void> {
    // This would typically use ListObjectsV2 and batch delete
    // For now, we'll implement a simple version
    const mediaTypes = ['audio', 'image', 'calligraphy'];
    
    for (const mediaType of mediaTypes) {
      try {
        // List and delete all objects with the word prefix
        // This is a simplified implementation
        const prefix = `words/${wordId}/${mediaType}/`;
        // In a real implementation, you'd list all objects with this prefix and delete them
      } catch (error) {
        // Log error but continue with other media types
        console.error(`Error deleting ${mediaType} media for word ${wordId}:`, error);
      }
    }
  }

  getMediaUrl(key: string): string {
    if (CLOUDFRONT_DOMAIN) {
      return `https://${CLOUDFRONT_DOMAIN}/${key}`;
    }
    return `https://${MEDIA_BUCKET}.s3.amazonaws.com/${key}`;
  }

  private generateMediaKey(wordId: string, mediaType: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `words/${wordId}/${mediaType}/${timestamp}_${sanitizedFileName}`;
  }

  // Helper method to extract media info from URL
  parseMediaUrl(url: string): { wordId: string; mediaType: string; fileName: string } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      if (pathParts.length >= 4 && pathParts[0] === 'words') {
        const wordId = pathParts[1];
        const mediaType = pathParts[2];
        const fileName = pathParts[3];
        
        return { wordId, mediaType, fileName };
      }
      
      return null;
    } catch {
      return null;
    }
  }

  // Generate presigned URL for downloading/viewing media
  async generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  // Validate media file constraints
  validateMediaConstraints(mediaType: string, contentType: string, fileSize?: number): void {
    const constraints = {
      audio: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
      },
      image: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      },
      calligraphy: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
      }
    };

    const constraint = constraints[mediaType as keyof typeof constraints];
    if (!constraint) {
      throw new Error(`Unsupported media type: ${mediaType}`);
    }

    if (!constraint.allowedTypes.includes(contentType)) {
      throw new Error(`Content type ${contentType} not allowed for ${mediaType}. Allowed types: ${constraint.allowedTypes.join(', ')}`);
    }

    if (fileSize && fileSize > constraint.maxSize) {
      throw new Error(`File size ${fileSize} exceeds maximum allowed size of ${constraint.maxSize} bytes for ${mediaType}`);
    }
  }
}