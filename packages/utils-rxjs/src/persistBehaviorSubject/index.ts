import { jsonSerializer, JsonValue } from "@vanya2h/utils/common";
import { Map } from "immutable";
import {
  BehaviorSubject,
  combineLatest,
  concatWith,
  firstValueFrom,
  lastValueFrom,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
} from "rxjs";

export type IPersistorTransport = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
};

export type IPersistor<T extends JsonValue> = {
  value$: Observable<T>;
  set: (value: T) => Promise<void>;
  get: () => Promise<T>;
};

export type IArrayPersistor<T extends JsonValue> = {
  get: () => Promise<T[]>;
  find: (predicate: (val: T) => boolean) => Promise<T[]>;
  findAndRemove: (predicate: (val: T) => boolean) => Promise<void>;
  updateOne: (predicate: (val: T) => boolean, modifier: (prev: T) => T) => Promise<void>;
  findOne: (predicate: (val: T) => boolean) => Promise<T>;
  findOneOrNull: (predicate: (val: T) => boolean) => Promise<T | null>;
  add: (next: T) => Promise<T>;
};

export function toArrayPersistor<T extends JsonValue>(persistor: IPersistor<T[]>): IArrayPersistor<T> {
  return {
    get: () => persistor.get(),
    find: (predicate) => persistor.get().then((x) => x.filter(predicate)),
    findAndRemove: (predicate) => persistor.get().then((x) => persistor.set(x.filter((x) => !predicate(x)))),
    updateOne: (predicate, modifier) =>
      persistor.get().then((x) => persistor.set(x.map((y) => (predicate(y) ? modifier(y) : y)))),
    findOne: (predicate) =>
      persistor.get().then((x) => {
        const found = x.find(predicate);
        if (found === undefined) throw new Error("Entity not found");
        return found;
      }),
    findOneOrNull: async (predicate) => persistor.get().then((x) => x.find(predicate) ?? null),
    add: (next) =>
      persistor
        .get()
        .then((x) => persistor.set([...x, next]))
        .then(() => next),
  };
}

export const localStorageTransport: IPersistorTransport = {
  set: async (key: string, value: string) => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.error("Can't set local storage value", err);
      }
    }
  },
  get: async (key: string) => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },
};

export function getStubTransport(): IPersistorTransport {
  const map = Map<string, string>();
  return {
    get: async (key: string) => map.get(key) ?? null,
    set: async (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

export function getPersistorFactory(prefix$: Observable<string>, transport$: Observable<IPersistorTransport>) {
  return <T extends JsonValue>(namespace: string, defaultValue$: Observable<T>): IPersistor<T> => {
    const path$ = prefix$.pipe(map((x) => x + namespace));
    const subject$ = new Subject<T>();

    const value$ = combineLatest([path$, transport$]).pipe(
      switchMap(([path, transport]) => transport.get(path)),
      switchMap((x) => (x === null ? defaultValue$ : of(jsonSerializer.parse(x) as T))),
      concatWith(subject$),
    );

    return {
      value$: value$,
      set: async (value: T) => {
        await lastValueFrom(
          combineLatest([path$, transport$]).pipe(
            tap(([path, transport]) => transport.set(path, jsonSerializer.stringify(value))),
            take(1),
          ),
        );
        return subject$.next(value);
      },
      get: () => firstValueFrom(value$),
    };
  };
}

export function getBehaviorSubjectPersistor<T extends JsonValue>(initialValue: T): IPersistor<T> {
  const subject = new BehaviorSubject(initialValue);
  return {
    value$: subject,
    set: async (x: T) => subject.next(x),
    get: async () => subject.getValue(),
  };
}
