import { db } from "$lib/server/db";
import { asc, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { employee } from "$lib/server/db/schema";
import * as v from "valibot";
import { fail, redirect, type Actions } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
  const users = await db.query.employee.findMany({
    orderBy: [asc(employee.id)],
  });

  return { users };
};

const baseSchema = v.object({
  givenName: v.pipe(v.string("First name is required"), v.nonEmpty("First name is required")),
  surname: v.pipe(v.string("Last name is required"), v.nonEmpty("Last name is required")),
  email: v.pipe(v.string("Email is required"), v.nonEmpty("Email is required"), v.email()),
  position: v.pipe(v.string("Position is required"), v.nonEmpty("Position is required")),
  role: v.picklist(["USER", "REVIEWER", "ADMINISTRATOR"] as const),
});

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const formData = await request.formData();
    const result = v.safeParse(baseSchema, {
      givenName: formData.get("givenName"),
      surname: formData.get("surname"),
      email: formData.get("email"),
      position: formData.get("position"),
      role: formData.get("role"),
    });

    if (!result.success) {
      return fail(400, { errors: v.flatten(result.issues).nested });
    }

    const d = result.output;

    await db.insert(employee).values({
      givenName: d.givenName,
      surname: d.surname,
      email: d.email,
      position: d.position,
      role: d.role,
    });

    return { success: true };
  },
  update: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const formData = await request.formData();
    const id = formData.get("id");
    const userId = typeof id === "string" ? Number(id) : NaN;

    if (!Number.isFinite(userId)) {
      return fail(400, { errors: { id: ["Invalid user id"] } });
    }

    const result = v.safeParse(baseSchema, {
      givenName: formData.get("givenName"),
      surname: formData.get("surname"),
      email: formData.get("email"),
      position: formData.get("position"),
      role: formData.get("role"),
    });

    if (!result.success) {
      return fail(400, { errors: v.flatten(result.issues).nested });
    }

    const d = result.output;

    await db
      .update(employee)
      .set({
        givenName: d.givenName,
        surname: d.surname,
        email: d.email,
        position: d.position,
        role: d.role,
      })
      .where(eq(employee.id, userId));

    return { success: true };
  },
  delete: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const formData = await request.formData();
    const id = formData.get("id");
    const userId = typeof id === "string" ? Number(id) : NaN;

    if (!Number.isFinite(userId)) {
      return fail(400, { errors: { id: ["Invalid user id"] } });
    }

    await db.delete(employee).where(eq(employee.id, userId));

    return { success: true };
  },
};
