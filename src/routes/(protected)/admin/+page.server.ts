import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { desc, eq, inArray } from "drizzle-orm";
import { employee, trainingHistory, location, certificate } from "$lib/server/db/schema";

export const load: PageServerLoad = async ({ locals }) => {
  const currentEmployee = locals.user
    ? await db.query.employee.findFirst({
        where: eq(employee.email, locals.user.email),
      })
    : null;

  const role = currentEmployee?.role ?? "USER";
  const currentId = currentEmployee?.id;

  const [rows, reviewers, allEmployees, allLocations, allTrainingHistory, allCertificates] =
    await Promise.all([
      db.query.trainingHistory.findMany({
        orderBy: [desc(trainingHistory.trainingDate)],
        limit: 10,
        ...(role === "USER" && currentId
          ? { where: eq(trainingHistory.traineeId, currentId) }
          : {}),
        with: {
          trainee: true,
          reviewer: true,
          training: true,
          location: true,
        },
      }),
      db
        .select({ id: employee.id, givenName: employee.givenName, surname: employee.surname })
        .from(employee)
        .where(inArray(employee.role, ["REVIEWER", "ADMINISTRATOR"])),
      db.select().from(employee),
      db.select().from(location),
      db.query.trainingHistory.findMany({
        with: {
          certificate: true,
          location: true,
        },
      }),
      db.select().from(certificate),
    ]);

  return {
    reviewers: reviewers.map((r) => ({ id: r.id, name: `${r.givenName} ${r.surname}` })),
    trainingHistory: rows.map((r) => ({
      id: r.id,
      traineeId: r.traineeId,
      traineeName: `${r.trainee.givenName} ${r.trainee.surname}`,
      trainingCode: r.trainingCode,
      trainingName: r.training.name,
      locationCode: r.locationCode,
      location: r.location.name,
      trainingDate: r.trainingDate.toISOString().slice(0, 10),
      reviewedDate: r.reviewedDate ? r.reviewedDate.toISOString().slice(0, 10) : null,
      certificateId: r.certificateId ?? null,
      reviewerId: r.reviewerId ?? null,
      reviewer: r.reviewer ? `${r.reviewer.givenName} ${r.reviewer.surname}` : null,
      status: r.status as "PENDING" | "APPROVED" | "REJECTED",
      remarks: r.remarks ?? null,
    })),
    allEmployees,
    allLocations,
    allTrainingHistory,
    allCertificates,
  };
};
