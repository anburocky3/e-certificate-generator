import { z } from "zod";

export const pinSchema = z.object({
  pin: z
    .string()
    .trim()
    .min(4, "PIN must be at least 4 characters.")
    .max(32, "PIN must be 32 characters or fewer."),
});

export const lookupSchema = z
  .object({
    rollNo: z.string().trim().max(80, "Roll number is too long.").optional(),
    email: z.string().trim().email("Enter a valid email address.").optional(),
  })
  .refine((values) => Boolean(values.rollNo || values.email), {
    message: "Enter a roll number or email address.",
    path: ["rollNo"],
  });

export type PinInput = z.infer<typeof pinSchema>;
export type LookupInput = z.infer<typeof lookupSchema>;

