import * as v from "valibot";

export const emailPasswordLoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Email is required"),
    v.email("Please enter a valid email address."),
  ),
  password: v.pipe(v.string(), v.nonEmpty("Password is required.")),
});

export const emailPasswordSignupSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Email is required"),
    v.email("Please enter a valid email address."),
  ),
  password: v.pipe(v.string(), v.nonEmpty("Password is required.")),
});

export type EmailPasswordLoginInput = v.InferInput<typeof emailPasswordLoginSchema>;
