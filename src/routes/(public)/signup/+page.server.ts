import { fail, redirect } from "@sveltejs/kit";
import * as v from "valibot";
import { db } from "$lib/server/db";
import { employee } from "$lib/server/db/schema";
import { auth } from "$lib/server/auth";
import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import type { Actions } from "./$types";

const signupSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Email is required"),
    v.email("Please enter a valid email address"),
  ),
  password: v.pipe(v.string(), v.nonEmpty("Password is required")),
});

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    const result = v.safeParse(signupSchema, {
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!result.success) {
      const flat = v.flatten(result.issues);
      return fail(400, {
        errors: Object.fromEntries(
          Object.entries(flat.nested ?? {}).map(([k, msgs]) => [k, (msgs as string[])[0] ?? ""]),
        ),
      });
    }

    const { email, password } = result.output;

    // Look up the employee to get their name
    const emp = await db.query.employee.findFirst({
      where: eq(employee.email, email),
    });

    if (!emp) {
      return fail(403, {
        errors: { email: "This email is not registered as an employee." },
      });
    }

    const name = `${emp.givenName} ${emp.surname}`;

    try {
      await auth.api.signUpEmail({
        body: { name, email, password },
      });
    } catch (err) {
      if (err instanceof APIError) {
        return fail(400, { errors: { email: err.message } });
      }
      return fail(500, { errors: { email: "An unexpected error occurred. Please try again." } });
    }

    throw redirect(302, "/dashboard");
  },
};
