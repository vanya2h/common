import { firstValueFrom, of, ReplaySubject, take, toArray } from "rxjs";
import {
  getBehaviorSubjectPersistor,
  getPersistorFactory,
  getStubTransport,
  IPersistor,
  IPersistorTransport,
  localStorageTransport,
  toArrayPersistor,
} from "./index.js";

function createMemoryTransport(initial: Record<string, string> = {}): IPersistorTransport & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...initial };
  return {
    store,
    get: async (key) => (key in store ? store[key]! : null),
    set: async (key, value) => {
      store[key] = value;
    },
  };
}

describe("getBehaviorSubjectPersistor", () => {
  it("get returns the initial value", async () => {
    const p = getBehaviorSubjectPersistor(42);
    expect(await p.get()).toBe(42);
  });

  it("value$ emits the current value to new subscribers", async () => {
    const p = getBehaviorSubjectPersistor("hello");
    expect(await firstValueFrom(p.value$)).toBe("hello");
  });

  it("set updates the value returned by get", async () => {
    const p = getBehaviorSubjectPersistor<number>(1);
    await p.set(2);
    expect(await p.get()).toBe(2);
  });

  it("value$ emits each set value", async () => {
    const p = getBehaviorSubjectPersistor<number>(0);
    const collected = firstValueFrom(p.value$.pipe(take(3), toArray()));
    await p.set(1);
    await p.set(2);
    expect(await collected).toEqual([0, 1, 2]);
  });

  it("supports object values", async () => {
    const p = getBehaviorSubjectPersistor<{ a: number }>({ a: 1 });
    await p.set({ a: 9 });
    expect(await p.get()).toEqual({ a: 9 });
  });
});

describe("getStubTransport", () => {
  it("returns null for an unset key", async () => {
    const t = getStubTransport();
    expect(await t.get("missing")).toBeNull();
  });

  // Documents a known bug: getStubTransport uses immutable's Map, whose `set`
  // returns a new Map without mutating, so writes are dropped.
  it.fails("get returns the value previously set under the same key", async () => {
    const t = getStubTransport();
    await t.set("k", "v");
    expect(await t.get("k")).toBe("v");
  });

  it("does not share state between independent instances", async () => {
    const a = getStubTransport();
    const b = getStubTransport();
    await a.set("k", "from-a");
    expect(await b.get("k")).toBeNull();
  });
});

describe("localStorageTransport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns null and is a no-op when localStorage is undefined", async () => {
    vi.stubGlobal("localStorage", undefined);
    expect(await localStorageTransport.get("k")).toBeNull();
    await expect(localStorageTransport.set("k", "v")).resolves.toBeUndefined();
  });

  it("reads from localStorage when available", async () => {
    const getItem = vi.fn().mockReturnValue("stored");
    vi.stubGlobal("localStorage", { getItem, setItem: vi.fn() });
    expect(await localStorageTransport.get("k")).toBe("stored");
    expect(getItem).toHaveBeenCalledWith("k");
  });

  it("writes to localStorage when available", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: vi.fn(), setItem });
    await localStorageTransport.set("k", "v");
    expect(setItem).toHaveBeenCalledWith("k", "v");
  });

  it("logs and swallows errors thrown by setItem", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("quota");
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: () => {
        throw boom;
      },
    });
    await expect(localStorageTransport.set("k", "v")).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith("Can't set local storage value", boom);
  });
});

describe("getPersistorFactory", () => {
  it("emits the default value when the transport has no entry", async () => {
    const transport = createMemoryTransport();
    const factory = getPersistorFactory(of("app:"), of(transport));
    const p = factory("user", of("default"));
    expect(await p.get()).toBe("default");
  });

  it("emits the parsed transport value when present", async () => {
    const transport = createMemoryTransport({ "app:user": JSON.stringify("stored") });
    const factory = getPersistorFactory(of("app:"), of(transport));
    const p = factory("user", of("default"));
    expect(await p.get()).toBe("stored");
  });

  it("writes the serialized value under the prefixed namespace on set", async () => {
    const transport = createMemoryTransport();
    const factory = getPersistorFactory(of("app:"), of(transport));
    const p = factory("count", of(0));
    await p.set(7);
    expect(transport.store["app:count"]).toBe(JSON.stringify(7));
  });

  it("set emits the new value via value$", async () => {
    const transport = createMemoryTransport({ "app:k": JSON.stringify("a") });
    const factory = getPersistorFactory(of("app:"), of(transport));
    const p = factory("k", of("default"));

    const replay = new ReplaySubject<string>(10);
    p.value$.subscribe(replay);

    await p.set("b");
    await p.set("c");

    const values = await firstValueFrom(replay.pipe(take(3), toArray()));
    expect(values).toEqual(["a", "b", "c"]);
  });

  it("round-trips bigint values through jsonSerializer", async () => {
    const transport = createMemoryTransport();
    const factory = getPersistorFactory(of(""), of(transport));

    const big = factory<bigint>("big", of(BigInt(0)));
    await big.set(BigInt(123));
    expect(await big.get()).toBe(BigInt(123));
  });

  it("re-reads when prefix$ emits a new prefix", async () => {
    const transport = createMemoryTransport({
      "v1:k": JSON.stringify("old"),
      "v2:k": JSON.stringify("new"),
    });
    const prefix$ = new ReplaySubject<string>(1);
    prefix$.next("v1:");

    const factory = getPersistorFactory(prefix$, of(transport));
    const p = factory("k", of("default"));

    expect(await p.get()).toBe("old");
    prefix$.next("v2:");
    expect(await p.get()).toBe("new");
  });
});

describe("toArrayPersistor", () => {
  type Item = { id: number; name: string };

  function makeArrayPersistor(initial: Item[]) {
    return toArrayPersistor<Item>(getBehaviorSubjectPersistor<Item[]>(initial));
  }

  it("get returns the underlying array", async () => {
    const p = makeArrayPersistor([{ id: 1, name: "a" }]);
    expect(await p.get()).toEqual([{ id: 1, name: "a" }]);
  });

  it("find returns items matching the predicate", async () => {
    const p = makeArrayPersistor([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 3, name: "a" },
    ]);
    expect(await p.find((x) => x.name === "a")).toEqual([
      { id: 1, name: "a" },
      { id: 3, name: "a" },
    ]);
  });

  it("findAndRemove removes matching items", async () => {
    const p = makeArrayPersistor([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 3, name: "a" },
    ]);
    await p.findAndRemove((x) => x.name === "a");
    expect(await p.get()).toEqual([{ id: 2, name: "b" }]);
  });

  it("updateOne applies modifier to matching items only", async () => {
    const p = makeArrayPersistor([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
    await p.updateOne(
      (x) => x.id === 2,
      (prev) => ({ ...prev, name: "B" }),
    );
    expect(await p.get()).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "B" },
    ]);
  });

  it("findOne returns the first match", async () => {
    const p = makeArrayPersistor([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
    expect(await p.findOne((x) => x.id === 2)).toEqual({ id: 2, name: "b" });
  });

  it("findOne rejects with 'Entity not found' when nothing matches", async () => {
    const p = makeArrayPersistor([{ id: 1, name: "a" }]);
    await expect(p.findOne((x) => x.id === 99)).rejects.toThrow("Entity not found");
  });

  it("findOneOrNull returns null when nothing matches", async () => {
    const p = makeArrayPersistor([{ id: 1, name: "a" }]);
    expect(await p.findOneOrNull((x) => x.id === 99)).toBeNull();
  });

  it("findOneOrNull returns the match when present", async () => {
    const p = makeArrayPersistor([{ id: 1, name: "a" }]);
    expect(await p.findOneOrNull((x) => x.id === 1)).toEqual({ id: 1, name: "a" });
  });

  it("add appends the item and resolves with it", async () => {
    const persistor: IPersistor<Item[]> = getBehaviorSubjectPersistor<Item[]>([]);
    const p = toArrayPersistor<Item>(persistor);
    const next = { id: 1, name: "a" };
    expect(await p.add(next)).toBe(next);
    expect(await persistor.get()).toEqual([next]);
  });

  it("uses a Subject so two consecutive adds compose", async () => {
    const p = makeArrayPersistor([]);
    await p.add({ id: 1, name: "a" });
    await p.add({ id: 2, name: "b" });
    expect(await p.get()).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });
});
