import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import dotenv from 'dotenv'
dotenv.config()

export class R2Service {
  private static client: S3Client | null = null

  private static getClient(): S3Client {
    if (this.client) return this.client

    const accountId = process.env.R2_ACCOUNT_ID || ''
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || ''
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY || ''

    this.client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })

    return this.client
  }

  private static getBucketName(): string {
    return process.env.R2_BUCKET || 'toystore-media'
  }

  /**
   * Generates a presigned PUT URL valid for ~5 minutes.
   * Allowing client side direct upload to Cloudflare R2 bucket.
   * @param key Unique key/prefix path inside the bucket
   * @param contentType MIME type of the file (e.g. image/webp, image/jpeg, application/pdf)
   */
  public static async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const s3 = this.getClient()
    const bucket = this.getBucketName()

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    })

    // URL expires in 300 seconds (5 minutes)
    return getSignedUrl(s3, command, { expiresIn: 300 })
  }

  /**
   * Builds the public retrieval URL for an object stored in R2.
   * @param key Unique key/prefix path inside the bucket
   */
  public static getPublicUrl(key: string): string {
    const publicBase = process.env.R2_PUBLIC_URL || 'https://media.nilkanthtoys.com'
    // Ensure clean slash joining
    const baseClean = publicBase.endsWith('/') ? publicBase.slice(0, -1) : publicBase
    const keyClean = key.startsWith('/') ? key.slice(1) : key
    return `${baseClean}/${keyClean}`
  }

  /**
   * Removes an object from Cloudflare R2 bucket.
   * @param key Unique key/prefix path inside the bucket
   */
  public static async deleteObject(key: string): Promise<void> {
    const s3 = this.getClient()
    const bucket = this.getBucketName()

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })

    await s3.send(command)
  }
}
