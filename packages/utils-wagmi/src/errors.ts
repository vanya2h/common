import { CustomError } from "@vanya2h/utils/common";

export class WalletIsRequiredError extends CustomError {
  constructor() {
    super({ message: "Wallet is required" });
  }
}

export function throwError(error: Error): never {
  throw error;
}
