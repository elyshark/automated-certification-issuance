import * as v from "valibot";

export const schema = v.object({
  id: v.number(),
  traineeId: v.number(),
  traineeName: v.string(),
  trainingCode: v.string(),
  trainingName: v.string(),
  locationCode: v.string(),
  location: v.string(),
  trainingDate: v.string(),
  reviewedDate: v.nullable(v.string()),
  certificateId: v.nullable(v.string()),
  reviewerId: v.nullable(v.number()),
  reviewer: v.nullable(v.string()),
  status: v.picklist(["PENDING", "APPROVED", "REJECTED"]),
  remarks: v.nullable(v.string()),
});

// InferOutput is the Valibot equivalent of z.infer
export type Schema = v.InferOutput<typeof schema>;
// Or v.InferInput<typeof schema> depending on your needs,
// though they are identical in this case since there are no transformation pipelines.
