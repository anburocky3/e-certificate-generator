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
    rollNo: z.string().trim().max(80, "Roll number is too long.").optional().or(z.literal("")),
    email: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((values, context) => {
    const rollNo = values.rollNo?.trim() || "";
    const email = values.email?.trim() || "";

    if (!rollNo && !email) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a roll number or email address.",
        path: ["rollNo"],
      });
      return;
    }

    if (email) {
      const emailCheck = z.string().email("Enter a valid email address.").safeParse(email);
      if (!emailCheck.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid email address.",
          path: ["email"],
        });
      }
    }
  })
  .transform((values) => ({
    rollNo: values.rollNo?.trim() || undefined,
    email: values.email?.trim() || undefined,
  }));

export type PinInput = z.infer<typeof pinSchema>;
export type LookupFormInput = z.input<typeof lookupSchema>;
export type LookupInput = z.output<typeof lookupSchema>;

