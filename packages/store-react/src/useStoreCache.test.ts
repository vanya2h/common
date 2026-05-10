import { renderHook } from "@testing-library/react";
import { createGlobalStore, createStoreDescriptor } from "@vanya2h/store";
import { firstValueFrom, of } from "rxjs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useStoreCache } from "./useStoreCache.js";

describe("useStoreCache", () => {
  it("returns a cache that resolves to the fetched value", async () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("nums", z.number());
    const store = globalStore.create(descriptor, { getDefaultValue: (id: number) => of(id) });

    const { result } = renderHook(() => useStoreCache(store, 5));
    const value = await firstValueFrom(result.current.value$);
    expect(value).toBe(5);
  });

  it("returns a stable reference for equivalent keys across rerenders", () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("nums", z.number());
    const store = globalStore.create(descriptor, { getDefaultValue: (id: number) => of(id) });

    const { result, rerender } = renderHook(({ k }) => useStoreCache(store, k), {
      initialProps: { k: 1 },
    });
    const first = result.current;
    rerender({ k: 1 });
    expect(result.current).toBe(first);
  });

  it("set() updates the value emitted by value$", async () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("nums", z.number());
    const store = globalStore.create(descriptor, { getDefaultValue: (id: number) => of(id) });

    const { result } = renderHook(() => useStoreCache(store, 7));
    expect(await firstValueFrom(result.current.value$)).toBe(7);

    result.current.set(42);
    expect(await firstValueFrom(result.current.value$)).toBe(42);
  });
});
