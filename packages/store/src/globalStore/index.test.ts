import { firstValueFrom, identity, lastValueFrom, Observable, of, tap } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createGlobalStore, createStoreDescriptor } from "./index.js";

describe("createGlobalStore", () => {
  it("should return cached value", async () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("my-store", z.number());
    const idFn = vi.fn();
    const fn = vi.fn((id: number) => of(id).pipe(tap(idFn)));
    const store = globalStore.create(descriptor, {
      getDefaultValue: fn,
    });
    const id = 1;
    const cache = store.get(id);

    const val = await firstValueFrom(cache.value$);
    expect(val).toEqual(id);
    const val2 = await firstValueFrom(cache.value$);
    expect(val).toEqual(val2);

    expect(idFn.mock.calls.length).toEqual(1);
    expect(fn.mock.calls.length).toEqual(1);
  });

  it("should respect force flag", async () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("my-store", z.number());
    const idFn = vi.fn();
    const fn = vi.fn((id: number) => of(id).pipe(tap(idFn)));
    const store = globalStore.create(descriptor, {
      getDefaultValue: fn,
    });
    const id = 1;

    const val = await firstValueFrom(store.getValue(id, true));
    expect(val).toEqual(id);
    const val2 = await firstValueFrom(store.getValue(id, true));
    expect(val).toEqual(val2);

    expect(idFn.mock.calls.length).toEqual(2);
    expect(fn.mock.calls.length).toEqual(2);
  });

  it("should refresh value", async () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("my-store", z.number());
    const fn = vi.fn((id: number): Observable<number> => of(id));
    const store = globalStore.create(descriptor, {
      getDefaultValue: fn,
    });
    const cache = store.get(1);

    const val = await firstValueFrom(cache.value$);
    expect(val).toEqual(1);
    expect(fn.mock.calls.length).toEqual(1);

    fn.mockImplementation((id: number): Observable<number> => of(id + 1));
    const nextVal = await lastValueFrom(cache.next());
    const val2 = await firstValueFrom(cache.value$);
    expect(nextVal).toEqual(val2);

    expect(fn.mock.calls.length).toEqual(2);
  });

  it("should return cached value for batch", async () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("my-store", z.number());

    const fetcher = vi.fn((id: number) => of(id));
    const store = globalStore.create(descriptor, {
      getDefaultValue: fetcher,
    });
    const length = 10;
    const ids = new Array(length).fill(0).map((_, i) => i);
    const entries = await Promise.all(ids.map((x) => firstValueFrom(store.getValue(x))));

    expect(fetcher.mock.calls.length).toEqual(10);
    expect(entries).toEqual(ids);

    const entries2 = await Promise.all(ids.map((x) => firstValueFrom(store.getValue(x))));

    expect(entries).toEqual(entries2);
    expect(fetcher.mock.calls.length).toEqual(10);
  });

  it("should preserve cache with list loader", async () => {
    const globalStore = createGlobalStore();
    const descriptor = createStoreDescriptor("my-store", z.number());

    const fetcher = vi.fn((id: number) => of(id));
    const store = globalStore.create(descriptor, {
      getDefaultValue: fetcher,
    });
    const loader = store.getLoader(
      (count: number) => of(new Array(count).fill(0).map((_, i) => [i, i] as [number, number])),
      identity,
    );
    const entries = await firstValueFrom(loader(2));
    expect(entries).toMatchInlineSnapshot(`
      [
        0,
        1,
      ]
    `);
    const single = await firstValueFrom(store.getValue(1));

    expect(fetcher.mock.calls.length).toEqual(0);
    expect(single).toEqual(1);

    const single2 = await firstValueFrom(store.getValue(2));
    expect(fetcher.mock.calls.length).toEqual(1);
    expect(single2).toEqual(2);
  });
});
