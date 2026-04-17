import { z } from "zod";

export function isSchema<T extends z.ZodSchema>(schema: T, x: unknown): x is z.input<T> {
  const val = schema.safeParse(x);
  return val.success;
}
