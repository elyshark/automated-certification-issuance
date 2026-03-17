import { json, error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { employee, location, training, trainingHistory } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
  const id = Number(params.id);
  if (isNaN(id)) error(400, "Invalid ID");

  const currentEmployee = locals.user
    ? await db.query.employee.findFirst({ where: eq(employee.email, locals.user.email) })
    : null;

  const role = currentEmployee?.role ?? "USER";
  const currentId = currentEmployee?.id;

  const [record, employees, trainings, locations] = await Promise.all([
    db.query.trainingHistory.findFirst({
      where: eq(trainingHistory.id, id),
      with: { trainee: true, reviewer: true, training: true, location: true, certificate: true },
    }),
    db
      .select({ id: employee.id, givenName: employee.givenName, surname: employee.surname })
      .from(employee),
    db.select({ code: training.code, name: training.name }).from(training),
    db.select({ code: location.code, name: location.name }).from(location),
  ]);

  if (!record) error(404, "Training record not found");
  if (role === "USER" && record.traineeId !== currentId) error(403, "Forbidden");

  return json({
    record: {
      id: record.id,
      traineeId: record.traineeId,
      reviewerId: record.reviewerId ?? null,
      trainingCode: record.trainingCode,
      locationCode: record.locationCode,
      trainingDate: record.trainingDate.toISOString(),
      status: record.status as "PENDING" | "APPROVED" | "REJECTED",
      remarks: record.remarks ?? null,
      certificateId: record.certificateId ?? null,
    },
    employees: employees.map((e) => ({ id: e.id, name: `${e.givenName} ${e.surname}` })),
    trainings,
    locations,
    role: role as "USER" | "REVIEWER" | "ADMINISTRATOR",
  });
};
