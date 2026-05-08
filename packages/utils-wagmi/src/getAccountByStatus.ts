import { CustomError } from "@vanya2h/utils/common";
import { Config as WagmiConfig, getAccount, reconnect } from "@wagmi/core";
import { throwError } from "./errors.js";
import { IWagmiAccount, IWagmiStatus } from "./types.js";

export type IWagmiAccountByStatus<T extends WagmiConfig, K extends IWagmiStatus<T>> = Extract<
  IWagmiAccount<T>,
  { status: K }
>;

/**
 * Returns account by status or throws error in case when status
 * is not matched with the required one
 */
export async function getAccountByStatus<T extends WagmiConfig, K extends IWagmiStatus<T>>(
  config: T,
  status: K,
): Promise<IWagmiAccountByStatus<T, K>> {
  let account = getAccount(config);

  if (account.status === "reconnecting") {
    try {
      await reconnect(config);
    } catch (error) {
      console.error(
        new CustomError({
          name: "CantReconnectError",
          message: "Can't reconnect connector, you may try to reconnect it manually",
          cause: error,
        }),
      );
    }
  }

  account = getAccount(config);

  if (account.status !== status) {
    return throwError(new AccountInvalidStatusError(account.status, status));
  }

  return account as IWagmiAccountByStatus<T, K>;
}

export class AccountInvalidStatusError<T extends WagmiConfig> extends CustomError {
  constructor(status: IWagmiStatus<T>, requiredStatus: IWagmiStatus<T>) {
    super({
      message: `Account is in ${status}, but it must be in ${requiredStatus} state`,
    });
  }
}
