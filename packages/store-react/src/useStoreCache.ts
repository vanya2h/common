import { IStore } from "@vanya2h/store";
import { JsonValue } from "@vanya2h/utils/common";
import { ICache } from "@vanya2h/utils-rxjs";
import { z } from "zod";

export function useStoreCache<T, K extends JsonValue, J extends z.ZodType<K>>(
  store: IStore<T, K, J>,
  key: z.output<J>,
): ICache<T> {
  return store.get(key);
}
