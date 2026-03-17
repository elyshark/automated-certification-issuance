import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { env } from "$env/dynamic/private";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { employee } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { APIError } from "better-auth";

export const auth = betterAuth({
  baseURL: env.ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const existingEmployee = await db
            .select()
            .from(employee)
            .where(eq(employee.email, user.email))
            .limit(1);

          if (existingEmployee.length === 0) {
            throw new APIError("FORBIDDEN", {
              message: "This email is not registered as an employee.",
            });
          }
        },
      },
    },
  },
  plugins: [sveltekitCookies(getRequestEvent)],
});
