import { z } from "zod";

export const IfSchemaEmpty = Symbol("IfSchemaEmpty");

export function ifSchema<T extends z.ZodSchema>(schema: T, x: z.input<T>): z.output<T> | typeof IfSchemaEmpty {
  const result = schema.safeParse(x);
  return result.success ? result.data : IfSchemaEmpty;
}
