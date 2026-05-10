import { IStore } from "@vanya2h/store";
import { JsonValue } from "@vanya2h/utils/common";
import { IPendingStatus, usePending } from "@vanya2h/utils-rxjs-react";
import { z } from "zod";

export function useStoreValue<T, K extends JsonValue, J extends z.ZodType<K>>(
  store: IStore<T, K, J>,
  key: z.output<J>,
): IPendingStatus<T> {
  return usePending(store.getValue(key));
}
