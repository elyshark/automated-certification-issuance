import { db } from "$lib/server/db";
import { certificate, employee, location, training, trainingHistory } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import * as v from "valibot";
import { uploadToR2 } from "$lib/server/r2";
import { getReviewerAllowedLocationCodes } from "$lib/server/permissions";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = Number(params.id);
  if (isNaN(id)) throw error(400, "Invalid ID");

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
      .select({
        id: employee.id,
        givenName: employee.givenName,
        surname: employee.surname,
        role: employee.role,
      })
      .from(employee),
    db.select({ code: training.code, name: training.name }).from(training),
    db.select({ code: location.code, name: location.name }).from(location),
  ]);

  if (!record) throw error(404, "Training record not found");

  // USER can only view their own record
  if (role === "USER" && record.traineeId !== currentId) {
    throw error(403, "You can only view your own training records");
  }

  if (role === "REVIEWER") {
    const allowedLocations = currentId ? await getReviewerAllowedLocationCodes(currentId) : [];
    const canViewByLocation = allowedLocations.includes(record.locationCode);
    const canViewOwn = currentId === record.traineeId;
    if (!canViewByLocation && !canViewOwn) {
      throw error(403, "You do not have access to this training record");
    }
  }

  return {
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
    employees: employees.map((e) => ({
      id: e.id,
      name: `${e.givenName} ${e.surname}`,
      role: e.role as "USER" | "REVIEWER" | "ADMINISTRATOR",
    })),
    trainings,
    locations,
    role,
  };
};

// ADMINISTRATOR schema: all fields editable
const adminSchema = v.object({
  traineeId: v.pipe(v.string(), v.nonEmpty("Trainee is required")),
  reviewerId: v.optional(v.string()),
  trainingCode: v.pipe(v.string(), v.nonEmpty("Training is required")),
  locationCode: v.pipe(v.string(), v.nonEmpty("Location is required")),
  status: v.picklist(
    ["PENDING", "APPROVED", "REJECTED"] as const,
    "Status must be PENDING, APPROVED, or REJECTED",
  ),
  trainingDate: v.pipe(v.string(), v.nonEmpty("Training date is required"), v.isoTimestamp()),
  remarks: v.optional(v.string()),
});

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const currentEmployee = await db.query.employee.findFirst({
      where: eq(employee.email, locals.user.email),
    });

    const role = currentEmployee?.role ?? "USER";
    if (role !== "ADMINISTRATOR") return fail(403, { error: "Forbidden" });

    const id = Number(params.id);
    const record = await db.query.trainingHistory.findFirst({
      where: eq(trainingHistory.id, id),
    });
    if (!record) return fail(404, { error: "Record not found" });

    const formData = await request.formData();
    const certFile = formData.get("certificate") as File | null;

    // Only ADMINISTRATOR can upload a certificate
    let certId: string | undefined;
    if (certFile && certFile.size > 0) {
      certId = `C${String(id).padStart(4, "0")}${Date.now().toString(36).toUpperCase().slice(-7)}`;
      const traineeId =
        role === "ADMINISTRATOR" ? Number(formData.get("traineeId")) : record.traineeId;
      const trainingCode = formData.get("trainingCode") as string;
      const locationCode = formData.get("locationCode") as string;
      const r2Key = `${locationCode}/${trainingCode}/${certId}.pdf`;
      await uploadToR2(r2Key, Buffer.from(await certFile.arrayBuffer()));
      await db.insert(certificate).values({
        id: certId,
        path: r2Key,
        employeeId: traineeId,
      });
    }

    const result = v.safeParse(adminSchema, {
      traineeId: formData.get("traineeId"),
      reviewerId: formData.get("reviewerId") || undefined,
      trainingCode: formData.get("trainingCode"),
      locationCode: formData.get("locationCode"),
      status: formData.get("status"),
      trainingDate: formData.get("trainingDate"),
      remarks: formData.get("remarks") || undefined,
    });
    if (!result.success) {
      return fail(400, { errors: v.flatten(result.issues).nested });
    }
    const d = result.output;

    const nextReviewerId = d.reviewerId ? Number(d.reviewerId) : null;
    if (nextReviewerId) {
      const reviewer = await db.query.employee.findFirst({
        columns: { role: true },
        where: eq(employee.id, nextReviewerId),
      });
      if (reviewer?.role !== "ADMINISTRATOR") {
        return fail(400, { error: "Reviewer must be an administrator" });
      }
    }

    await db
      .update(trainingHistory)
      .set({
        traineeId: Number(d.traineeId),
        reviewerId: nextReviewerId,
        trainingCode: d.trainingCode,
        locationCode: d.locationCode,
        status: d.status,
        trainingDate: new Date(d.trainingDate),
        remarks: d.remarks ?? null,
        reviewedDate: d.status !== "PENDING" ? new Date() : null,
        ...(certId ? { certificateId: certId } : {}),
      })
      .where(eq(trainingHistory.id, id));

    return { success: true };
  },
};
