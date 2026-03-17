import { db } from "$lib/server/db";
import { desc, eq, inArray } from "drizzle-orm";
import { certificate, employee, trainingHistory } from "$lib/server/db/schema";
import { fail, redirect } from "@sveltejs/kit";
import * as v from "valibot";
import { uploadToR2 } from "$lib/server/r2";
import { triggerApprovalFlow } from "$lib/server/power-automate";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // Get the current employee's role to scope the query
  const currentEmployee = locals.user
    ? await db.query.employee.findFirst({
        where: eq(employee.email, locals.user.email),
      })
    : null;

  const role = currentEmployee?.role ?? "USER";
  const currentId = currentEmployee?.id;

  const [rows, reviewers] = await Promise.all([
    db.query.trainingHistory.findMany({
      orderBy: [desc(trainingHistory.trainingDate)],
      // USER sees only their own rows; REVIEWER and ADMINISTRATOR see all
      ...(role === "USER" && currentId ? { where: eq(trainingHistory.traineeId, currentId) } : {}),
      with: {
        trainee: true,
        reviewer: true,
        training: true,
        location: true,
      },
    }),
    // Reviewers dropdown: REVIEWER and ADMINISTRATOR roles
    db
      .select({ id: employee.id, givenName: employee.givenName, surname: employee.surname })
      .from(employee)
      .where(inArray(employee.role, ["REVIEWER", "ADMINISTRATOR"])),
  ]);

  return {
    role: role,
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
  };
};

const createSchema = v.object({
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
  renewedFromId: v.optional(v.string()),
});

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const currentEmployee = await db.query.employee.findFirst({
      where: eq(employee.email, locals.user.email),
    });
    if (!currentEmployee) return fail(403, { error: "Employee not found" });
    const role = currentEmployee.role ?? "USER";

    const formData = await request.formData();
    const result = v.safeParse(createSchema, {
      traineeId: formData.get("traineeId"),
      reviewerId: formData.get("reviewerId") || undefined,
      trainingCode: formData.get("trainingCode"),
      locationCode: formData.get("locationCode"),
      status: formData.get("status"),
      trainingDate: formData.get("trainingDate"),
      remarks: formData.get("remarks") || undefined,
      renewedFromId: formData.get("renewedFromId") || undefined,
    });

    if (!result.success) {
      return fail(400, { errors: v.flatten(result.issues).nested });
    }
    const d = result.output;

    // USER and REVIEWER create records for themselves with PENDING status
    const isSelfCreate = role === "USER" || role === "REVIEWER";
    const finalTraineeId = isSelfCreate ? currentEmployee.id : Number(d.traineeId);
    const finalStatus = isSelfCreate ? "PENDING" : d.status;
    const finalRemarks = isSelfCreate ? null : (d.remarks ?? null);
    const renewedFromId = d.renewedFromId ? Number(d.renewedFromId) : null;

    // REVIEWER can assign a reviewer (but not themselves); USER cannot
    let finalReviewerId: number | null = null;
    if (role === "ADMINISTRATOR") {
      finalReviewerId = d.reviewerId ? Number(d.reviewerId) : null;
    } else if (role === "REVIEWER" && d.reviewerId) {
      const rid = Number(d.reviewerId);
      // REVIEWER cannot assign themselves
      finalReviewerId = rid !== currentEmployee.id ? rid : null;
    }

    const [newRecord] = await db
      .insert(trainingHistory)
      .values({
        traineeId: finalTraineeId,
        reviewerId: finalReviewerId,
        trainingCode: d.trainingCode,
        locationCode: d.locationCode,
        status: finalStatus,
        trainingDate: new Date(d.trainingDate),
        remarks: finalRemarks,
        reviewedDate: finalStatus !== "PENDING" ? new Date() : null,
        renewedFromId: renewedFromId,
      })
      .returning({ id: trainingHistory.id });

    const certFile = formData.get("certificate") as File | null;
    if (certFile && certFile.size > 0 && !isSelfCreate) {
      const certId = `C${String(newRecord.id).padStart(4, "0")}${Date.now().toString(36).toUpperCase().slice(-7)}`;
      const r2Key = `${d.locationCode}/${d.trainingCode}/${certId}.pdf`;
      await uploadToR2(r2Key, Buffer.from(await certFile.arrayBuffer()));
      await db.insert(certificate).values({
        id: certId,
        path: r2Key,
        employeeId: finalTraineeId,
      });
      await db
        .update(trainingHistory)
        .set({ certificateId: certId })
        .where(eq(trainingHistory.id, newRecord.id));
    }

    // If a reviewer was assigned during creation, trigger the approval flow
    if (finalReviewerId && finalStatus === "PENDING") {
      try {
        await triggerApprovalFlow({
          trainingHistoryId: newRecord.id,
          traineeId: finalTraineeId,
          reviewerId: finalReviewerId,
          trainingCode: d.trainingCode,
          locationCode: d.locationCode,
          trainingDate: new Date(d.trainingDate),
        });
      } catch (e) {
        console.error("Failed to trigger approval flow:", e);
        // Don't fail the record creation if the flow trigger fails
      }
    }

    return { success: true };
  },

  assignReviewer: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const currentEmployee = await db.query.employee.findFirst({
      where: eq(employee.email, locals.user.email),
    });
    if (!currentEmployee) return fail(403, { error: "Employee not found" });

    const role = currentEmployee.role ?? "USER";
    if (role === "USER") return fail(403, { error: "Forbidden" });

    const formData = await request.formData();
    const trainingHistoryId = Number(formData.get("trainingHistoryId"));
    const reviewerId = Number(formData.get("reviewerId"));

    console.log(
      "[assignReviewer] trainingHistoryId:",
      trainingHistoryId,
      "reviewerId:",
      reviewerId,
    );

    if (!trainingHistoryId || !reviewerId) {
      console.log("[assignReviewer] Missing fields, returning 400");
      return fail(400, { error: "Missing trainingHistoryId or reviewerId" });
    }

    // Fetch the training history record
    const record = await db.query.trainingHistory.findFirst({
      where: eq(trainingHistory.id, trainingHistoryId),
    });
    if (!record) return fail(404, { error: "Record not found" });

    console.log(
      "[assignReviewer] record status:",
      record.status,
      "existing reviewerId:",
      record.reviewerId,
    );

    // Only allow assigning to PENDING records without a reviewer
    if (record.status !== "PENDING") {
      console.log("[assignReviewer] Not PENDING, returning 400");
      return fail(400, { error: "Can only assign reviewers to PENDING records" });
    }
    if (record.reviewerId !== null) {
      console.log("[assignReviewer] Reviewer already assigned, returning 400");
      return fail(400, { error: "Reviewer already assigned" });
    }

    // REVIEWER cannot assign themselves
    if (role === "REVIEWER" && reviewerId === currentEmployee.id) {
      return fail(400, { error: "Cannot assign yourself as reviewer" });
    }

    // Update the reviewer
    await db
      .update(trainingHistory)
      .set({ reviewerId })
      .where(eq(trainingHistory.id, trainingHistoryId));

    console.log("[assignReviewer] DB updated, triggering Power Automate...");

    // Trigger the Power Automate approval flow
    try {
      await triggerApprovalFlow({
        trainingHistoryId,
        traineeId: record.traineeId,
        reviewerId,
        trainingCode: record.trainingCode,
        locationCode: record.locationCode,
        trainingDate: record.trainingDate,
      });
      console.log("[assignReviewer] Power Automate triggered successfully");
    } catch (e) {
      console.error("[assignReviewer] Failed to trigger approval flow:", e);
      // The reviewer is already assigned — don't roll back, just log the error
    }

    return { success: true };
  },
};
