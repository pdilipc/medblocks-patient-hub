import { z } from "zod";

export const patientFormSchema = z.object({
  given: z.string().trim().min(1, "Given name is required"),
  family: z.string().trim().min(1, "Family name is required"),
  gender: z.enum(["male", "female", "other", "unknown"]),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .refine((v) => new Date(v).getTime() <= Date.now(), "Date of birth cannot be in the future"),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
