import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Note title is required").max(120),
  content: z.string().max(10000).default(""),
  color: z.enum(["default", "blue", "green", "amber", "rose"]).default("default")
});

export const transactionSchema = z.object({
  transactionType: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than zero").max(999999999999),
  category: z.string().trim().min(1, "Category is required").max(60),
  description: z.string().max(500).optional().default(""),
  transactionDate: z.string().date(),
  currency: z.string().length(3).default("BDT")
});
