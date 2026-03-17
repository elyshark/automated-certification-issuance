import { db } from "$lib/server/db";
import { employee, location, training, trainingHistory } from "$lib/server/db/schema";
import { eq, isNotNull, or } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { triggerManualReminderFlow } from "$lib/server/power-automate";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      mapPoints: [],
      role: "USER" as const,
      currentId: null,
      trainingCode: null,
      trainingLocation: null,
      nextExpiry: null,
      traineeId: null,
      traineeName: null,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      rejectedWithRemarks: 0,
      nextTrainingHistoryId: null,
      employees: [],
      trainings: [],
      locations: [],
    };
  }

  const currentEmployee = await db.query.employee.findFirst({
    where: eq(employee.email, locals.user.email),
  });

  if (!currentEmployee) {
    return {
      mapPoints: [],
      role: "USER" as const,
      currentId: null,
      trainingCode: null,
      trainingLocation: null,
      nextExpiry: null,
      traineeId: null,
      traineeName: null,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      rejectedWithRemarks: 0,
      nextTrainingHistoryId: null,
      employees: [],
      trainings: [],
      locations: [],
    };
  }

  const role = currentEmployee.role ?? "USER";
  const currentId = currentEmployee.id;

  const whereClauseForMap =
    role === "USER"
      ? eq(trainingHistory.traineeId, currentId)
      : role === "REVIEWER"
        ? or(eq(trainingHistory.traineeId, currentId), eq(trainingHistory.reviewerId, currentId))
        : undefined;

  const rows = await db.query.trainingHistory.findMany({
    ...(whereClauseForMap ? { where: whereClauseForMap } : {}),
    with: { location: true },
  });

  const byLocation = new Map<
    string,
    {
      code: string;
      name: string;
      latitude: number;
      longitude: number;
      receivedCount: number;
      approvedCount: number;
      allCount: number;
    }
  >();

  for (const row of rows) {
    if (!row.location?.latitude || !row.location?.longitude) continue;
    const latitude = Number(row.location.latitude);
    const longitude = Number(row.location.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const received = row.traineeId === currentId;
    const approved =
      row.status === "APPROVED" && (role === "ADMINISTRATOR" || row.reviewerId === currentId);

    if (role === "USER" && !received) continue;
    if (role === "REVIEWER" && !received && !approved) continue;

    const key = row.location.code;
    if (!byLocation.has(key)) {
      byLocation.set(key, {
        code: row.location.code,
        name: row.location.name,
        latitude,
        longitude,
        receivedCount: 0,
        approvedCount: 0,
        allCount: 0,
      });
    }

    const entry = byLocation.get(key)!;

    if (received) entry.receivedCount += 1;
    if (approved) entry.approvedCount += 1;
    if (role === "ADMINISTRATOR") entry.allCount += 1;
  }

  const whereClauseForCard1 =
    role === "USER"
      ? eq(trainingHistory.traineeId, currentId)
      : role === "REVIEWER"
        ? or(eq(trainingHistory.traineeId, currentId), eq(trainingHistory.reviewerId, currentId))
        : undefined;

  const historyRows = await db.query.trainingHistory.findMany({
    ...(whereClauseForCard1 ? { where: whereClauseForCard1 } : {}),
    with: { certificate: true, location: true, trainee: true },
  });

  const [employees, trainings, locations] = await Promise.all([
    db
      .select({ id: employee.id, givenName: employee.givenName, surname: employee.surname })
      .from(employee),
    db.select({ code: training.code, name: training.name }).from(training),
    db.select({ code: location.code, name: location.name }).from(location),
  ]);

  const renewedRows = await db.query.trainingHistory.findMany({
    columns: { renewedFromId: true },
    where: isNotNull(trainingHistory.renewedFromId),
  });

  const renewedIds = new Set(renewedRows.map((row) => row.renewedFromId).filter(Boolean));
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;

  const upcoming = historyRows
    .filter((row) => row.status === "APPROVED" && row.certificate?.expiryDate)
    .filter((row) => !renewedIds.has(row.id))
    .map((row) => ({
      row,
      expiryDate: new Date(row.certificate!.expiryDate!),
    }))
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  const next = upcoming[0];
  const nextExpiry = next
    ? Math.max(0, Math.ceil((next.expiryDate.getTime() - today.getTime()) / msPerDay))
    : null;

  const statusCounts = historyRows.reduce(
    (acc, row) => {
      if (row.status === "PENDING") acc.pending += 1;
      if (row.status === "APPROVED") acc.approved += 1;
      if (row.status === "REJECTED") acc.rejected += 1;
      if (row.status === "REJECTED" && row.remarks) acc.rejectedWithRemarks += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, rejectedWithRemarks: 0 },
  );

  return {
    mapPoints: Array.from(byLocation.values()),
    role,
    currentId,
    trainingCode: next?.row.trainingCode ?? null,
    trainingLocation: next?.row.location?.name ?? null,
    nextExpiry,
    traineeId: next?.row.traineeId ?? null,
    traineeName: next?.row.trainee
      ? `${next.row.trainee.givenName} ${next.row.trainee.surname}`.trim()
      : null,
    pendingCount: statusCounts.pending,
    approvedCount: statusCounts.approved,
    rejectedCount: statusCounts.rejected,
    rejectedWithRemarks: statusCounts.rejectedWithRemarks,
    nextTrainingHistoryId: next?.row.id ?? null,
    employees: employees.map((e) => ({ id: e.id, name: `${e.givenName} ${e.surname}` })),
    trainings,
    locations,
  };
};

export const actions: Actions = {
  sendReminder: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const formData = await request.formData();
    const trainingHistoryId = Number(formData.get("trainingHistoryId"));
    const traineeId = Number(formData.get("traineeId"));

    if (!trainingHistoryId || !traineeId) {
      return { success: false };
    }

    const [record, traineeRow, reminderRow] = await Promise.all([
      db.query.trainingHistory.findFirst({
        where: eq(trainingHistory.id, trainingHistoryId),
        with: { training: true, location: true, certificate: true },
      }),
      db.query.employee.findFirst({ where: eq(employee.id, traineeId) }),
      db.query.employee.findFirst({ where: eq(employee.email, locals.user.email) }),
    ]);

    if (!record || !traineeRow || !reminderRow) {
      return { success: false };
    }

    const expiryDate = record.certificate?.expiryDate;
    const certificateId = record.certificateId ?? "";
    if (!expiryDate || !certificateId) {
      return { success: false };
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysTillExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / msPerDay));

    await triggerManualReminderFlow({
      traineeEmail: traineeRow.email,
      traineeGivenName: traineeRow.givenName,
      reminderEmail: reminderRow.email,
      trainingCode: record.trainingCode,
      trainingName: record.training?.name ?? "",
      certificateId: certificateId,
      expiryDate: expiryDate.toISOString(),
      daysTillExpiry: String(daysTillExpiry),
      locationCode: record.locationCode,
      locationName: record.location?.name ?? "",
    });

    return { success: true };
  },
};
