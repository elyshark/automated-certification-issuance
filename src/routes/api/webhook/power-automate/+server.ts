import { json, error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { certificate, trainingHistory } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { completeMultipartUpload } from "$lib/server/r2";
import type { RequestHandler } from "./$types";

/**
 * Webhook callback endpoint for Power Automate.
 *
 * Handles three scenarios:
 * 1. APPROVED: Training is approved - generates certificate and updates status
 * 2. REJECTED: Training is rejected - updates status to REJECTED
 * 3. FAILED: Power Automate flow failed - updates status to FAILED
 *
 * Request body:
 * - trainingHistoryId: the training history record ID
 * - traineeId: the employee ID of the trainee
 * - status: "approved", "rejected", or "failed"
 * - certId: the formed certificate ID (only for approved)
 * - r2Path: the R2 object key (only for approved)
 * - uploadId: the multipart upload ID
 * - etag: the ETag for completing upload (only for approved)
 * - remarks: approval comments/rejection reason
 * - error: error message (only for failed)
 *
 * The webhook:
 * 1. Validates the x-webhook-secret header
 * 2. Routes based on status (approved/rejected/failed)
 * 3. Updates the training history record accordingly
 */
export const POST: RequestHandler = async ({ request }) => {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== env.WEBHOOK_SECRET) {
    error(401, "Invalid webhook secret");
  }

  const body = await request.json();
  const {
    trainingHistoryId,
    traineeId,
    status,
    certId,
    r2Path,
    uploadId,
    etag,
    remarks,
    error: flowError,
  } = body;

  if (!trainingHistoryId || !traineeId) {
    error(400, "Missing required fields: trainingHistoryId, traineeId");
  }

  // Verify the training history record exists
  const record = await db.query.trainingHistory.findFirst({
    where: eq(trainingHistory.id, Number(trainingHistoryId)),
  });

  if (!record) {
    error(404, "Training history record not found");
  }

  // Handle APPROVED status
  if (status === "approved") {
    if (!certId || !r2Path || !uploadId || !etag) {
      error(400, "Missing required fields for approval: certId, r2Path, uploadId, etag");
    }

    // Complete the multipart upload so the PDF object is finalized in R2
    await completeMultipartUpload(r2Path, uploadId, [{ PartNumber: 1, ETag: etag }]);

    // Compute expiry date (24 months from training date)
    const expiryDate = new Date(record.trainingDate);
    expiryDate.setMonth(expiryDate.getMonth() + 24);

    // Insert the certificate
    await db.insert(certificate).values({
      id: certId,
      path: r2Path,
      employeeId: Number(traineeId),
      issuedDate: new Date(),
      expiryDate,
    });

    // Update the training history
    await db
      .update(trainingHistory)
      .set({
        certificateId: certId,
        status: "APPROVED",
        reviewedDate: new Date(),
        remarks: remarks || null,
      })
      .where(eq(trainingHistory.id, Number(trainingHistoryId)));

    return json({ success: true, status: "approved" });
  }

  // Handle REJECTED status
  if (status === "rejected") {
    await db
      .update(trainingHistory)
      .set({
        status: "REJECTED",
        reviewedDate: new Date(),
        remarks: remarks || null,
      })
      .where(eq(trainingHistory.id, Number(trainingHistoryId)));

    return json({ success: true, status: "rejected" });
  }

  // Handle FAILED status - mark as REJECTED since flow failed
  if (status === "failed") {
    await db
      .update(trainingHistory)
      .set({
        status: "REJECTED",
        remarks: flowError || "Power Automate flow encountered an error",
      })
      .where(eq(trainingHistory.id, Number(trainingHistoryId)));

    return json({ success: true, status: "failed" });
  }

  error(400, `Invalid status: ${status}. Expected "approved", "rejected", or "failed"`);
};
