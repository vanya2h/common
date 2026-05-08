import { JsonValue } from "@vanya2h/utils/common";
import { createCache, ICache } from "@vanya2h/utils-rxjs";
import { Map as IM } from "immutable";
import objectHash from "object-hash";
import { BehaviorSubject, combineLatest, from, map, noop, Observable, of, shareReplay, take, tap } from "rxjs";
import { z } from "zod";

export type IStore<T, K extends JsonValue, J extends z.ZodType<K>> = {
  get: (key: z.output<J>) => ICache<T>;
  getValue: (key: z.output<J>, force?: boolean) => Observable<T>;
  getMany: (key: z.output<J>[]) => Observable<T[]>;
  getLoader: <TRequest extends any[], B>(
    loader: (...args: TRequest) => Observable<[z.output<J>, B][]>,
    mapValue: (val: B) => T,
  ) => (...args: TRequest) => Observable<B[]>;
};

// @todo add defaultValue as input parameter to support SSR

export function createGlobalStore() {
  const store = new BehaviorSubject(IM<string, ICache<any>>());

  return {
    store: store,
    create: <T, K extends JsonValue, J extends z.ZodType<K>>(
      descriptor: IStoreDescriptor<J>,
      {
        getDefaultValue,
        onValue = noop,
      }: {
        getDefaultValue: (key: z.output<J>) => Observable<T>;
        onValue?: (key: z.output<J>, value: T) => void;
      },
    ): IStore<T, K, J> => {
      const getCache = (key: z.output<J>, force = false) => {
        const storeValue = store.getValue();
        const keyString = descriptor.getKey(key);
        let cache: ICache<T> | undefined = storeValue.get(keyString);
        if (force || !cache) {
          cache = createCache(() => getDefaultValue(key).pipe(tap((x) => onValue(key, x))));
          store.next(storeValue.set(keyString, cache));
        }
        return cache;
      };
      const getValue = (key: z.output<J>, force = false) => {
        return getCache(key, force).value$;
      };
      const getMany = (keys: z.output<J>[], force = false) => {
        return keys.length > 0 ? combineLatest(keys.map((x) => getValue(x, force))) : of([]);
      };
      const getLoader = <TRequest extends any[], B>(
        loader: (...args: TRequest) => Observable<[z.output<J>, B][]>,
        mapValue: (val: B) => T,
      ) => {
        return (...args: TRequest) => {
          return loader(...args).pipe(
            tap((x) =>
              x.map(([key, value]) => {
                const mapped = mapValue(value);
                onValue(key, mapped);
                getCache(key).set(mapped);
              }),
            ),
            take(1),
            map((x) => x.map((y) => y[1])),
            shareReplay({
              bufferSize: 1,
              refCount: true,
            }),
          );
        };
      };
      return {
        get: getCache,
        getValue: getValue,
        getMany: getMany,
        getLoader: getLoader,
      };
    },
  };
}

export type IGlobalStore = ReturnType<typeof createGlobalStore>;

export type IStoreFetcher<T, K extends JsonValue, J extends z.ZodType<K>> = {
  many: (key: z.output<J>[]) => Observable<(T | null | undefined)[]>;
  single: (key: z.output<J>) => Observable<T>;
};

export type IStoreDescriptor<T extends z.ZodType> = {
  getKey: (value: z.output<T>) => string;
};

export function createStoreDescriptor<K extends JsonValue, T extends z.ZodType<K>>(
  namespace: string,
  schema: T,
): IStoreDescriptor<T> {
  return {
    getKey: (value: z.output<T>) => {
      if (!schema.safeParse(value).success) {
        console.warn(`Key of ${namespace} store is not aligned with the schema`);
      }
      return `${namespace}:${toHash(schema.parse(value))}`;
    },
  };
}

function toHash(val: JsonValue) {
  if (typeof val === "bigint") return val.toString();
  return objectHash(val);
}

export function fromFetcher<TRequest extends any[], T, J>({
  fetcher,
  getKey,
}: {
  fetcher: (...args: TRequest) => Promise<T[]>;
  getKey: (value: T) => J;
}) {
  return (...request: TRequest) => from(fetcher(...request)).pipe(map((x) => x.map((y) => [getKey(y), y] as [J, T])));
}
