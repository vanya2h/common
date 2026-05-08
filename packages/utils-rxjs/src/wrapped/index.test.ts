import { firstValueFrom, Subscription } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import {
  createFulfilled,
  createIdle,
  createPending,
  createRejected,
  createWrappedPromise,
  StatusEnum,
} from "./index.js";

describe("status factories", () => {
  it("createIdle returns IDLE status", () => {
    expect(createIdle()).toEqual({ type: StatusEnum.IDLE });
  });

  it("createPending returns PENDING status with args", () => {
    expect(createPending([1, "a"])).toEqual({
      type: StatusEnum.PENDING,
      args: [1, "a"],
    });
  });

  it("createFulfilled returns FULFILLED status with args and value", () => {
    expect(createFulfilled([1], "ok")).toEqual({
      type: StatusEnum.FULFILLED,
      args: [1],
      value: "ok",
    });
  });

  it("createRejected returns REJECTED status with args and error", () => {
    const err = new Error("boom");
    expect(createRejected([1], err)).toEqual({
      type: StatusEnum.REJECTED,
      args: [1],
      error: err,
    });
  });
});

describe("createWrappedPromise", () => {
  it("starts in IDLE state", async () => {
    const wrapped = createWrappedPromise(async () => 1);
    const status = await firstValueFrom(wrapped.status$);
    expect(status).toEqual({ type: StatusEnum.IDLE });
  });

  it("transitions IDLE → PENDING → FULFILLED on success and returns value", async () => {
    const wrapped = createWrappedPromise(async (n: number) => n * 2);
    const seen: StatusEnum[] = [];
    const sub = wrapped.status$.subscribe((s) => seen.push(s.type));

    const result = await wrapped.run(21);

    expect(result).toBe(42);
    expect(seen).toEqual([StatusEnum.IDLE, StatusEnum.PENDING, StatusEnum.FULFILLED]);
    sub.unsubscribe();
  });

  it("transitions IDLE → PENDING → REJECTED on failure and rethrows", async () => {
    const err = new Error("nope");
    const wrapped = createWrappedPromise(async () => {
      throw err;
    });
    const events: Array<{ type: StatusEnum; error?: unknown }> = [];
    const sub = wrapped.status$.subscribe((s) =>
      events.push({ type: s.type, error: "error" in s ? s.error : undefined }),
    );

    await expect(wrapped.run()).rejects.toBe(err);
    expect(events.map((e) => e.type)).toEqual([StatusEnum.IDLE, StatusEnum.PENDING, StatusEnum.REJECTED]);
    expect(events[2]!.error).toBe(err);
    sub.unsubscribe();
  });

  it("PENDING and FULFILLED carry the original args", async () => {
    const wrapped = createWrappedPromise(async (a: number, b: string) => `${a}-${b}`);
    const states: unknown[] = [];
    const sub = wrapped.status$.subscribe((s) => states.push(s));

    await wrapped.run(7, "x");

    expect(states[1]).toEqual({ type: StatusEnum.PENDING, args: [7, "x"] });
    expect(states[2]).toEqual({
      type: StatusEnum.FULFILLED,
      args: [7, "x"],
      value: "7-x",
    });
    sub.unsubscribe();
  });

  it("result$ emits only on FULFILLED", async () => {
    let resolveFn: (v: number) => void = () => {};
    const wrapped = createWrappedPromise(() => new Promise<number>((r) => (resolveFn = r)));
    const emitted: number[] = [];
    const sub = wrapped.result$.subscribe((v) => emitted.push(v));

    expect(emitted).toEqual([]);

    const running = wrapped.run();
    expect(emitted).toEqual([]);

    resolveFn(99);
    await running;

    expect(emitted).toEqual([99]);
    sub.unsubscribe();
  });

  it("result$ does not emit on REJECTED", async () => {
    const wrapped = createWrappedPromise(async () => {
      throw new Error("x");
    });
    const emitted: unknown[] = [];
    const sub = wrapped.result$.subscribe((v) => emitted.push(v));

    await wrapped.run().catch(() => {});

    expect(emitted).toEqual([]);
    sub.unsubscribe();
  });

  it("result$ replays last fulfilled value to late subscribers", async () => {
    const wrapped = createWrappedPromise(async () => "hello");
    await wrapped.run();

    const value = await firstValueFrom(wrapped.result$);
    expect(value).toBe("hello");
  });

  it("reset() returns status$ to IDLE", async () => {
    const wrapped = createWrappedPromise(async () => 1);
    await wrapped.run();
    expect((await firstValueFrom(wrapped.status$)).type).toBe(StatusEnum.FULFILLED);

    wrapped.reset();
    expect(await firstValueFrom(wrapped.status$)).toEqual({ type: StatusEnum.IDLE });
  });

  it("calls the underlying fn with the supplied args each run", async () => {
    const fn = vi.fn(async (a: number, b: number) => a + b);
    const wrapped = createWrappedPromise(fn);

    await wrapped.run(1, 2);
    await wrapped.run(3, 4);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[0]).toEqual([1, 2]);
    expect(fn.mock.calls[1]).toEqual([3, 4]);
  });

  it("supports successive runs updating status$ to the latest result", async () => {
    const wrapped = createWrappedPromise(async (n: number) => n);
    const sub = new Subscription();
    const types: StatusEnum[] = [];
    sub.add(wrapped.status$.subscribe((s) => types.push(s.type)));

    await wrapped.run(1);
    await wrapped.run(2);

    expect(types).toEqual([
      StatusEnum.IDLE,
      StatusEnum.PENDING,
      StatusEnum.FULFILLED,
      StatusEnum.PENDING,
      StatusEnum.FULFILLED,
    ]);
    sub.unsubscribe();
  });
});
