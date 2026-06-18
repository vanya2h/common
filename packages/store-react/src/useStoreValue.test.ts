import { act, renderHook } from "@testing-library/react";
import { createGlobalStore, createStoreDescriptor } from "@vanya2h/store";
import { of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useStoreValue } from "./useStoreValue.js";

describe("useStoreValue", () => {
  it("resolves to fulfilled with the stored value", () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("nums", z.number());
    const fetcher = vi.fn((id: number) => of(id));
    const store = globalStore.create(descriptor, { getDefaultValue: fetcher });

    const { result } = renderHook(() => useStoreValue(store, 1));
    expect(result.current).toEqual({ status: "fulfilled", value: 1 });
  });

  it("re-renders when the cache is updated via set", () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("nums", z.number());
    const store = globalStore.create(descriptor, {
      getDefaultValue: (id: number) => of(id),
    });

    const { result } = renderHook(() => useStoreValue(store, 1));
    expect(result.current).toEqual({ status: "fulfilled", value: 1 });

    act(() => store.get(1).set(99));
    expect(result.current).toEqual({ status: "fulfilled", value: 99 });
  });

  it("returns the cached value across separate hook instances", () => {
    const fetcher = vi.fn((id: number) => of(id * 10));
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("nums", z.number());
    const store = globalStore.create(descriptor, { getDefaultValue: fetcher });

    const { result: r1 } = renderHook(() => useStoreValue(store, 2));
    expect(r1.current).toEqual({ status: "fulfilled", value: 20 });

    const { result: r2 } = renderHook(() => useStoreValue(store, 2));
    expect(r2.current).toEqual({ status: "fulfilled", value: 20 });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
