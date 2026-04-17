import z from "zod";
import { INumberish, NumberishSchema } from "./numberish/numberish.js";

export const Int256 = createInt256((x) => x);
export type IInt256 = z.output<typeof Int256>;

export const Int256Positive = createInt256((x) => x.min(BigInt(0)));
export type IInt256Positive = z.output<typeof Int256Positive>;

export function createInt256(corce: (bn: z.ZodBigInt) => z.ZodBigInt) {
  return NumberishSchema.pipe(corce(z.coerce.bigint()));
}

export const Int256Json = z.string().brand("Int256");
export type IInt256Json = z.output<typeof Int256Json>;

export function toInt256Json(value: INumberish): IInt256Json {
  if (typeof value === "bigint") {
    return value.toString() as IInt256Json;
  }

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error(`Number ${value} is not a safe integer and cannot be converted to bigint`);
    }
    return value.toString() as IInt256Json;
  }

  if (typeof value === "string") {
    if (value.trim().length === 0) {
      throw new Error("String cannot be empty");
    }

    try {
      return value.trim() as IInt256Json;
    } catch {
      throw new Error(`String "${value}" is not a valid bigint`);
    }
  }

  throw new Error(`Invalid type: ${typeof value}`);
}
