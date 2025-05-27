import { z } from "zod";

export const VerifierSchema = z.array(
  z.object({
    title: z.string(),
    status: z.enum(["DUPLICATE", "OK"]),
    reason: z.string().min(5)
  })
);
