import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "$env/dynamic/private";

function getR2Client() {
  if (!env.R2_ACCOUNT_ID) throw new Error("R2_ACCOUNT_ID is not set");
  if (!env.R2_ACCESS_KEY_ID) throw new Error("R2_ACCESS_KEY_ID is not set");
  if (!env.R2_SECRET_ACCESS_KEY) throw new Error("R2_SECRET_ACCESS_KEY is not set");

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function getBucketName() {
  if (!env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set");
  return env.R2_BUCKET_NAME;
}

/**
 * Generate a presigned PUT URL for uploading a file to R2.
 * Used by Power Automate to upload the generated PDF certificate.
 *
 * @param key - The object key, e.g. "KUL/DDT/DDT-KUL-001.pdf"
 * @param expiresIn - URL validity in seconds (default: 1 hour)
 */
export async function generatePresignedPutUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: "application/pdf",
  });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a presigned GET URL for downloading a file from R2.
 * Used to let users download their certificate PDFs.
 *
 * @param key - The object key, e.g. "KUL/DDT/DDT-KUL-001.pdf"
 * @param expiresIn - URL validity in seconds (default: 15 minutes)
 */
export async function generatePresignedGetUrl(key: string, expiresIn = 900): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Upload a file buffer directly to R2.
 * Used for manual admin certificate uploads from the drawer form.
 *
 * @param key - The object key
 * @param body - The file content as a Buffer or Uint8Array
 * @param contentType - MIME type (default: application/pdf)
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType = "application/pdf",
) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return client.send(command);
}

/**
 * Initiate a multipart upload to R2.
 * Returns the UploadId needed for uploading parts and completing the upload.
 *
 * @param key - The object key, e.g. "KUL/DDT/DDT-KUL-001.pdf"
 */
export async function initiateMultipartUpload(key: string): Promise<string> {
  const client = getR2Client();
  const command = new CreateMultipartUploadCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: "application/pdf",
  });
  const response = await client.send(command);
  if (!response.UploadId) throw new Error("Failed to initiate multipart upload");
  return response.UploadId;
}

/**
 * Generate a presigned URL for uploading a single part in a multipart upload.
 * Power Automate will PUT the PDF binary body to this URL.
 *
 * @param key - The object key
 * @param uploadId - The UploadId from initiateMultipartUpload
 * @param partNumber - The part number (1-based)
 * @param expiresIn - URL validity in seconds (default: 1 hour)
 */
export async function generatePresignedPartUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn = 3600,
): Promise<string> {
  const client = getR2Client();
  const command = new UploadPartCommand({
    Bucket: getBucketName(),
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Complete a multipart upload after all parts have been uploaded.
 * Must be called with the ETag returned from each part upload.
 *
 * @param key - The object key
 * @param uploadId - The UploadId from initiateMultipartUpload
 * @param parts - Array of { PartNumber, ETag } for each uploaded part
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
) {
  const client = getR2Client();
  const command = new CompleteMultipartUploadCommand({
    Bucket: getBucketName(),
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  return client.send(command);
}
