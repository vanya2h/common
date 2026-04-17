import { Hash, isHash } from "viem";
import { z } from "zod";

export const TransactionHashSchema = z
  .string()
  .refine((x): x is Hash => isHash(x), { message: "Not a valid transaction hash string" })
  .transform((x) => x as Hash);

export type ITransactionHash = z.output<typeof TransactionHashSchema>;
