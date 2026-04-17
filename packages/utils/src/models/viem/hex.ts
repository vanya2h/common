import { Hex, isHex } from "viem";
import { z } from "zod";

export const HexStringSchema = z
  .string()
  .refine((x): x is Hex => isHex(x), { message: "Not a valid Hexademical string" })
  .transform((x) => x as Hex);

export type IHexString = z.output<typeof HexStringSchema>;
