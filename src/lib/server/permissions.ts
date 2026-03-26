import { db } from "$lib/server/db";
import { certificate, training, trainingHistory } from "$lib/server/db/schema";
import { and, eq, gte, isNotNull } from "drizzle-orm";

const INSTALLATION_INSPECTOR_TRAINING = "Installation Inspector";

export async function getReviewerAllowedLocationCodes(reviewerId: number) {
  const rows = await db
    .select({ locationCode: trainingHistory.locationCode })
    .from(certificate)
    .innerJoin(trainingHistory, eq(trainingHistory.certificateId, certificate.id))
    .innerJoin(training, eq(trainingHistory.trainingCode, training.code))
    .where(
      and(
        eq(certificate.employeeId, reviewerId),
        eq(training.name, INSTALLATION_INSPECTOR_TRAINING),
        isNotNull(certificate.expiryDate),
        gte(certificate.expiryDate, new Date()),
      ),
    );

  return Array.from(new Set(rows.map((row) => row.locationCode)));
}
