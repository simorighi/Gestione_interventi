import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;
