import { Config as WagmiConfig, getAccount } from "@wagmi/core";

/**
 * Infers chains list from arbitrary wagmi config
 */
export type InferWagmiChains<TWagmiConfig extends WagmiConfig> = TWagmiConfig["chains"][number];

/**
 * Infers chain ids list from arbitrary wagmi config
 */
export type InferWagmiChainIds<TWagmiConfig extends WagmiConfig> = InferWagmiChains<TWagmiConfig>["id"];

export type IWagmiAccount<T extends WagmiConfig> = ReturnType<typeof getAccount<T>>;

/**
 * All possible wagmi connection status union
 */
export type IWagmiStatus<T extends WagmiConfig> = IWagmiAccount<T>["status"];
