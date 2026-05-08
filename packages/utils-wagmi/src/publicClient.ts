import { Config as WagmiConfig, getPublicClient, GetPublicClientReturnType } from "@wagmi/core";
import { WalletIsRequiredError } from "./errors.js";
import { InferWagmiChainIds } from "./types.js";

export function getPublicClientWithChain<TConfig extends WagmiConfig, TChainId extends InferWagmiChainIds<TConfig>>(
  wagmiConfig: TConfig,
  chainId: TChainId,
): NonNullable<GetPublicClientReturnType<TConfig, TChainId>> {
  const publicClient = getPublicClient(wagmiConfig, { chainId });
  if (!publicClient) {
    throw new WalletIsRequiredError();
  }
  return publicClient;
}
