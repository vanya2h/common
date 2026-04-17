import { Address, isAddress } from "viem";
import { z } from "zod";

export const AddressSchema = z
  .string()
  .refine((x): x is Address => isAddress(x), { message: "Not a valid address string" })
  .transform((x) => x as Address);

export type IAddressString = z.output<typeof AddressSchema>;
