import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const signupSchema = loginSchema
  .extend({
    fullName: z.string().min(2, "Full name is required"),
    confirmPassword: z.string().min(8),
    terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) })
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

export const forgotPasswordSchema = z.object({ email: z.string().email() });
