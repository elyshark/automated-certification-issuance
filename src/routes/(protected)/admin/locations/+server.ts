import { db } from "$lib/server/db";
import { location } from "$lib/server/db/schema";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const locations = await db
    .select({
      code: location.code,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    })
    .from(location);

  return json(locations);
};
