import { error, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { certificate } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { generatePresignedGetUrl } from "$lib/server/r2";
import type { RequestHandler } from "./$types";

/**
 * Certificate download endpoint.
 *
 * Looks up the certificate's R2 path from the database,
 * generates a presigned GET URL, and redirects the user to it.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    error(401, "Unauthorized");
  }

  const cert = await db.query.certificate.findFirst({
    where: eq(certificate.id, params.certId),
  });

  if (!cert) {
    error(404, "Certificate not found");
  }

  // If the path is a fake URL, redirect to the placeholder ebook
  if (cert.path.startsWith("https://fakeurl.com/")) {
    redirect(302, "/ebook.pdf");
  }

  // Generate a short-lived presigned GET URL (15 min)
  const downloadUrl = await generatePresignedGetUrl(cert.path);

  redirect(302, downloadUrl);
};
