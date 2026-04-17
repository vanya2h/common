import { Chain, extractChain } from "viem";
import { z } from "zod";

export function SupportedChainIds<TChains extends Chain[] | readonly Chain[]>(chains: TChains) {
  type ChainId = `${TChains[number]["id"]}`;
  const literals = chains.map((chain) => z.literal(`${chain.id}` as ChainId)) as [
    z.ZodLiteral<ChainId>,
    z.ZodLiteral<ChainId>,
    ...z.ZodLiteral<ChainId>[],
  ];
  return z.union(literals);
}

export function createSupportedChains<TChains extends Chain[] | readonly Chain[]>(chains: TChains) {
  const Schema = SupportedChainIds(chains);
  type ChainId = `${TChains[number]["id"]}`;
  return {
    Schema: Schema,
    chains: chains,
    chainIds: chains.map((x) => `${x.id}` as ChainId) as ChainId[],
    isSupported: (chainId: string): chainId is ChainId => !!chains.find((x) => `${x.id}` === chainId),
    get: <T extends ChainId>(
      chainId: T,
    ): Extract<TChains[number], { id: T extends `${infer N extends number}` ? N : never }> =>
      extractChain({ chains, id: Number(chainId) as T extends `${infer N extends number}` ? N : never }),
  };
}
