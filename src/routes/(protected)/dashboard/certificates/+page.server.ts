import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { certificate, employee, trainingHistory, training } from "$lib/server/db/schema";
import { eq, inArray, or } from "drizzle-orm";
import { getReviewerAllowedLocationCodes } from "$lib/server/permissions";
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

  const role = currentEmployee.role ?? "USER";
  const currentId = currentEmployee.id;
  const allowedLocations =
    role === "REVIEWER" ? await getReviewerAllowedLocationCodes(currentId) : [];

  let certsQuery = db
    .select({
      id: certificate.id,
      path: certificate.path,
      issuedDate: certificate.issuedDate,
      expiryDate: certificate.expiryDate,
      employeeId: certificate.employeeId,
      employeeGivenName: employee.givenName,
      employeeSurname: employee.surname,
      trainingName: training.name,
      reviewerId: trainingHistory.reviewerId,
      locationCode: trainingHistory.locationCode,
    })
    .from(certificate)
    .innerJoin(trainingHistory, eq(trainingHistory.certificateId, certificate.id))
    .innerJoin(training, eq(trainingHistory.trainingCode, training.code))
    .innerJoin(employee, eq(certificate.employeeId, employee.id));

  if (role === "USER") {
    certsQuery = certsQuery.where(eq(certificate.employeeId, currentId));
  } else if (role === "REVIEWER") {
    const reviewerWhere = allowedLocations.length
      ? or(
          eq(certificate.employeeId, currentId),
          inArray(trainingHistory.locationCode, allowedLocations),
        )
      : eq(certificate.employeeId, currentId);
    certsQuery = certsQuery.where(reviewerWhere);
  }

  // Get certificates with necessary relations
  const allCertificatesData = await certsQuery;

  return {
    certificates: allCertificatesData,
  };
};
