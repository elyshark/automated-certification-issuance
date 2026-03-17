import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { certificate } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
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
 * Certificate view endpoint - proxies PDF from R2 with proper CORS headers.
 *
 * This endpoint fetches the PDF from R2 and returns it directly to the browser,
 * avoiding CORS issues that arise when trying to fetch directly from R2.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    error(401, "Unauthorized");
  }

  if (!params.certId) {
    error(400, "Certificate ID is required");
  }

  const cert = await db.query.certificate.findFirst({
    where: eq(certificate.id, params.certId as string),
  });

  if (!cert) {
    error(404, "Certificate not found");
  }

  if (cert.path.startsWith("https://fakeurl.com/")) {
    redirect(302, "/ebook.pdf");
  }

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: cert.path,
    });

    const response = await client.send(command);

    // Convert the ReadableStream to a Buffer
    const chunks: Uint8Array[] = [];
    if (response.Body) {
      const reader = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of reader) {
        chunks.push(chunk);
      }
    }

    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": buffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Error fetching certificate from R2:", err);
    error(500, "Failed to fetch certificate");
  }
};
