import z from "zod";

export function IdSchema<T extends string>(brandName: T) {
  return z.string().brand(brandName);
}
