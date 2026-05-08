import { Config as WagmiConfig, getBytecode } from "@wagmi/core";
import { Address, getAddress } from "viem";

export async function isContract<TWagmiConfig extends WagmiConfig>(
  config: TWagmiConfig,
  address: Address,
): Promise<boolean> {
  const bytecode = await getBytecode(config, {
    address: getAddress(address),
  });
  return bytecode !== null && bytecode !== "0x";
}
