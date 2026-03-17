import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { employee, location, training } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const currentEmployee = locals.user
    ? await db.query.employee.findFirst({ where: eq(employee.email, locals.user.email) })
    : null;

  const role = (currentEmployee?.role ?? "USER") as "USER" | "REVIEWER" | "ADMINISTRATOR";

  const [employees, trainings, locations] = await Promise.all([
    db
      .select({ id: employee.id, givenName: employee.givenName, surname: employee.surname })
      .from(employee),
    db.select({ code: training.code, name: training.name }).from(training),
    db.select({ code: location.code, name: location.name }).from(location),
  ]);

  return json({
    employees: employees.map((e) => ({ id: e.id, name: `${e.givenName} ${e.surname}` })),
    trainings,
    locations,
    role,
  });
};
