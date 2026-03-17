import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { certificate, employee, trainingHistory, training } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const currentEmployee = await db.query.employee.findFirst({
    where: eq(employee.email, locals.user.email),
  });

  if (!currentEmployee) {
    throw redirect(302, "/login");
  }

  // Get all certificates with necessary relations
  const allCertificatesData = await db
    .select({
      id: certificate.id,
      path: certificate.path,
      issuedDate: certificate.issuedDate,
      expiryDate: certificate.expiryDate,
      employeeId: certificate.employeeId,
      trainingName: training.name,
      reviewerId: trainingHistory.reviewerId,
    })
    .from(certificate)
    .innerJoin(trainingHistory, eq(trainingHistory.certificateId, certificate.id))
    .innerJoin(training, eq(trainingHistory.trainingCode, training.code));

  return {
    certificates: allCertificatesData,
  };
};
