import * as v from "valibot";

export const schema = v.object({
  id: v.number(),
  givenName: v.string(),
  surname: v.string(),
  email: v.string(),
  position: v.string(),
  role: v.picklist(["USER", "REVIEWER", "ADMINISTRATOR"]),
});

export type Schema = v.InferOutput<typeof schema>;
