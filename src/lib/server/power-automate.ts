import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { employee, location, training, trainingHistory } from "$lib/server/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { initiateMultipartUpload, generatePresignedPartUrl } from "$lib/server/r2";

interface TriggerFlowParams {
  trainingHistoryId: number;
  traineeId: number;
  reviewerId: number;
  trainingCode: string;
  locationCode: string;
  trainingDate: Date;
}

interface ManualReminderParams {
  traineeEmail: string;
  traineeGivenName: string;
  reminderEmail: string;
  trainingCode: string;
  trainingName: string;
  certificateId: string;
  expiryDate: string;
  daysTillExpiry: string;
  locationCode: string;
  locationName: string;
}

/**
 * Triggers the Power Automate approval flow when a reviewer is assigned.
 *
 * This function:
 * 1. Fetches the trainee, reviewer, training, and location details
 * 2. Computes a running number for the certificate ID
 * 3. Generates a presigned PUT URL so Power Automate can upload the PDF to R2
 * 4. Sends the HTTP trigger request to Power Automate
 */
export async function triggerApprovalFlow(params: TriggerFlowParams) {
  const triggerUrl = env.POWER_AUTOMATE_TRIGGER_URL;
  if (!triggerUrl) throw new Error("POWER_AUTOMATE_TRIGGER_URL is not set");

  const webhookSecret = env.WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("WEBHOOK_SECRET is not set");

  const origin = env.ORIGIN;
  if (!origin) throw new Error("ORIGIN is not set");

  // Fetch related entities in parallel
  const [traineeRow, reviewerRow, trainingRow, locationRow] = await Promise.all([
    db.query.employee.findFirst({ where: eq(employee.id, params.traineeId) }),
    db.query.employee.findFirst({ where: eq(employee.id, params.reviewerId) }),
    db.query.training.findFirst({ where: eq(training.code, params.trainingCode) }),
    db.query.location.findFirst({ where: eq(location.code, params.locationCode) }),
  ]);

  if (!traineeRow) throw new Error(`Trainee ${params.traineeId} not found`);
  if (!reviewerRow) throw new Error(`Reviewer ${params.reviewerId} not found`);
  if (!trainingRow) throw new Error(`Training ${params.trainingCode} not found`);
  if (!locationRow) throw new Error(`Location ${params.locationCode} not found`);

  // Compute running number: count existing certificates for this training+location combo + 1
  const existingCerts = await db
    .select({ id: trainingHistory.id })
    .from(trainingHistory)
    .where(
      and(
        eq(trainingHistory.trainingCode, params.trainingCode),
        eq(trainingHistory.locationCode, params.locationCode),
        isNotNull(trainingHistory.certificateId),
      ),
    );

  const runningNumber = existingCerts.length + 1;

  // Form the certificate ID: e.g. DDT-KUL-001
  const certId = `${params.trainingCode}-${params.locationCode}-${String(runningNumber).padStart(3, "0")}`;

  // R2 object key: e.g. KUL/DDT/DDT-KUL-001.pdf
  const r2Key = `${params.locationCode}/${params.trainingCode}/${certId}.pdf`;

  // Initiate a multipart upload and generate a presigned URL for part 1
  const uploadId = await initiateMultipartUpload(r2Key);
  const presignedPartUrl = await generatePresignedPartUrl(r2Key, uploadId, 1, 3600);

  // Callback URL for Power Automate to notify us when done
  const callbackUrl = `${origin}/api/webhook/power-automate`;

  const payload = {
    trainingHistoryId: params.trainingHistoryId,
    traineeId: params.traineeId,
    traineeName: `${traineeRow.givenName} ${traineeRow.surname}`,
    traineeEmail: traineeRow.email,
    trainingCode: params.trainingCode,
    trainingName: trainingRow.name,
    trainingDate: params.trainingDate.toISOString().slice(0, 10),
    reviewerName: `${reviewerRow.givenName} ${reviewerRow.surname}`,
    reviewerPosition: reviewerRow.position,
    reviewerEmail: reviewerRow.email,
    locationCode: params.locationCode,
    locationName: locationRow.name,
    runningNumber,
    certId,
    r2Key,
    uploadId,
    callbackUrl,
    webhookSecret,
    presignedPutUrl: presignedPartUrl,
  };

  const response = await fetch(triggerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Power Automate trigger failed (${response.status}): ${text}`);
  }

  return { certId, r2Key };
}

/**
 * Triggers the Power Automate reminder flow for expiring or expired certificates.
 */
export async function triggerManualReminderFlow(params: ManualReminderParams) {
  const triggerUrl = env.POWER_AUTOMATE_MANUAL_REMINDER_TRIGGER_URL;
  if (!triggerUrl) throw new Error("POWER_AUTOMATE_MANUAL_REMINDER_TRIGGER_URL is not set");

  const response = await fetch(triggerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Power Automate manual reminder failed (${response.status}): ${text}`);
  }
}
