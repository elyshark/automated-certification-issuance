import * as v from "valibot";

export const schema = v.object({
  code: v.string(),
  name: v.string(),
  latitude: v.nullable(v.string()),
  longitude: v.nullable(v.string()),
});

export type Schema = v.InferOutput<typeof schema>;
