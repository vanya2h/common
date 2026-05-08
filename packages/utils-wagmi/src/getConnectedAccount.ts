import { CustomError } from "@vanya2h/utils/common";
import { Config as WagmiConfig } from "@wagmi/core";
import { Address, isAddressEqual } from "viem";
import { getAccountByStatus, IWagmiAccountByStatus } from "./getAccountByStatus.js";

/**
 * Returns connected account to wagmi or throws error in case
 * when wallet is not connected with wagmi
 */
export async function getConnectedAccount<T extends WagmiConfig>(config: T) {
  const status = await getAccountByStatus(config, "connected");
  return status;
}

export type IWagmiConnectedAccount<T extends WagmiConfig> = IWagmiAccountByStatus<T, "connected">;

/**
 * Returns connected required account or throws error
 * in case when account is (one of):
 * 1. Not connected.
 * 2. Connected address is not equal to requested.
 */
export async function getRequiredAccount<T extends WagmiConfig>(config: T, requiredAddress: Address) {
  const account = await getConnectedAccount(config);
  if (!isAddressEqual(account.address, requiredAddress)) {
    throw new CustomError({
      message: `Connected account must be ${requiredAddress}`,
      name: "RequiredAccountNotMetError",
      data: {
        requiredAddress: requiredAddress,
        currentAddress: account.address,
      },
    });
  }
  return account;
}
