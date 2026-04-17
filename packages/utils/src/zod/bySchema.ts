import { z } from "zod";

export function bySchema<T extends z.ZodSchema>(schema: T, x: z.input<T>): z.output<T> {
  return schema.parse(x);
}
