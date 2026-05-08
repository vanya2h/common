import { firstValueFrom, of, Subscription, tap } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { createCache, ICache } from "./index.js";

describe("createCache", () => {
  it("should use the default value when provided", async () => {
    const defaultValue = 42;
    const buildSource = vi.fn(() => of(1));
    const cache: ICache<number> = createCache(buildSource, of(defaultValue));

    const val = await firstValueFrom(cache.value$);
    expect(buildSource.mock.calls.length).toEqual(0);
    expect(val).toEqual(defaultValue);
  });

  it("should call buildSource when next is invoked and return its value", async () => {
    const value = 10;
    const buildSource = vi.fn(() => of(value));
    const cache: ICache<number> = createCache(buildSource);

    const val = await firstValueFrom(cache.value$);
    expect(val).toBe(value);
    expect(buildSource.mock.calls.length).toEqual(1);
  });

  it("should emit the value set using the set method", async () => {
    const tapFn = vi.fn();
    const cache: ICache<number> = createCache(() => of(1).pipe(tap(tapFn)));
    cache.set(100);

    const val = await firstValueFrom(cache.value$);
    expect(tapFn.mock.calls.length).toEqual(0);
    expect(val).toEqual(100);
  });

  it("should not fetch if value$ is reading second time", async () => {
    const tapFn = vi.fn();
    const cache: ICache<number> = createCache(() => of(1).pipe(tap(tapFn)));

    const val = await firstValueFrom(cache.value$);
    const val2 = await firstValueFrom(cache.value$);
    expect(val).toEqual(val2);
    expect(tapFn.mock.calls.length).toEqual(1);
  });

  it("should switch to a new observable when next is called", () => {
    let sourceValue = 0;
    const sub = new Subscription();
    const cache: ICache<number> = createCache(() => of(sourceValue));

    sourceValue = 20;
    sub.add(cache.next().subscribe((value) => expect(value).toBe(20)));
    sourceValue = 30;
    sub.add(cache.next().subscribe((value) => expect(value).toBe(30)));

    sub.unsubscribe();
  });
});
