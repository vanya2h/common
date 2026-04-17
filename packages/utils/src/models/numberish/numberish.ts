import { z } from "zod";

export const NumberishSchema = z.union([z.string(), z.number(), z.bigint()]);

export type INumberish = z.input<typeof NumberishSchema>;

export const NumberishJsonSchema = z.union([z.string(), z.number()]);

export type INumberishJson = z.input<typeof NumberishSchema>;

export const StringNumberSchema = z
  .string()
  .transform((x) => x.replace(",", "."))
  .refine((x) => !isNaN(Number(x)), { message: "Invalid number format" })
  .transform((x) => Number(x));
