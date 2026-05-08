import { Config as WagmiConfig, getWalletClient, GetWalletClientReturnType } from "@wagmi/core";
import { WalletIsRequiredError } from "./errors.js";
import { InferWagmiChainIds } from "./types.js";

export async function getWalletClientWithChain<
  TConfig extends WagmiConfig,
  TChainId extends InferWagmiChainIds<TConfig>,
>(wagmiConfig: TConfig, chainId: TChainId): Promise<NonNullable<GetWalletClientReturnType<TConfig, TChainId>>> {
  const walletClient = await getWalletClient(wagmiConfig, { chainId });

  if (!walletClient) {
    throw new WalletIsRequiredError();
  }
  const connectedChainId = await walletClient.getChainId();
  if (connectedChainId !== chainId) {
    await walletClient.switchChain({ id: chainId });
  }
  return walletClient;
}
