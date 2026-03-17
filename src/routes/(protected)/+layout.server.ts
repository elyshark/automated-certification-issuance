import { redirect, error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { employee } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const emp = await db.query.employee.findFirst({
    where: eq(employee.email, locals.user.email),
  });

  const role = emp?.role || "USER";

  if (url.pathname.startsWith("/admin") && role !== "ADMINISTRATOR") {
    throw error(403, "Forbidden: Administrators only.");
  }

  if (url.pathname.startsWith("/review") && role !== "ADMINISTRATOR" && role !== "REVIEWER") {
    throw error(403, "Forbidden: Administrators or Reviewers only.");
  }

  return {
    user: locals.user,
    employee: emp ?? null,
  };
};
