import { db } from "$lib/server/db";
import { asc, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { location } from "$lib/server/db/schema";
import * as v from "valibot";
import { fail, redirect, type Actions } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
  const locations = await db.query.location.findMany({ orderBy: [asc(location.code)] });

  return { locations };
};

const createSchema = v.object({
  code: v.pipe(
    v.string("Code is required"),
    v.nonEmpty("Code cannot be empty"),
    v.length(3, "Code must be exactly 3 characters"),
    v.toUpperCase(),
  ),
  name: v.pipe(v.string("Name is required"), v.nonEmpty("Name cannot be empty")),
  latitude: v.optional(
    v.nullable(v.pipe(v.string(), v.regex(/^-?\d{1,3}(?:\.\d{1,7})?$/, "Invalid latitude format"))),
  ),
  longitude: v.optional(
    v.nullable(
      v.pipe(v.string(), v.regex(/^-?\d{1,3}(?:\.\d{1,7})?$/, "Invalid longitude format")),
    ),
  ),
});

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const formData = await request.formData();
    const result = v.safeParse(createSchema, {
      code: formData.get("code"),
      name: formData.get("name"),
      latitude: formData.get("latitude") || undefined,
      longitude: formData.get("longitude") || undefined,
    });

    if (!result.success) {
      return fail(400, { errors: v.flatten(result.issues).nested });
    }

    const d = result.output;

    await db.insert(location).values({
      code: d.code,
      name: d.name,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
    });

    return { success: true };
  },
  update: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const formData = await request.formData();
    const result = v.safeParse(createSchema, {
      code: formData.get("code"),
      name: formData.get("name"),
      latitude: formData.get("latitude") || undefined,
      longitude: formData.get("longitude") || undefined,
    });

    if (!result.success) {
      return fail(400, { errors: v.flatten(result.issues).nested });
    }

    const d = result.output;

    await db
      .update(location)
      .set({
        name: d.name,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
      })
      .where(eq(location.code, d.code));

    return { success: true };
  },
  delete: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/login");

    const formData = await request.formData();
    const code = formData.get("code");

    if (typeof code !== "string" || code.length !== 3) {
      return fail(400, { errors: { code: ["Invalid location code"] } });
    }

    await db.delete(location).where(eq(location.code, code.toUpperCase()));

    return { success: true };
  },
};
