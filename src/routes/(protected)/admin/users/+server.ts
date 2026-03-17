import { db } from "$lib/server/db";
import { employee } from "$lib/server/db/schema";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const users = await db
    .select({
      id: employee.id,
      givenName: employee.givenName,
      surname: employee.surname,
      email: employee.email,
      position: employee.position,
      role: employee.role,
    })
    .from(employee)
    .orderBy(employee.id);

  return json(users);
};
