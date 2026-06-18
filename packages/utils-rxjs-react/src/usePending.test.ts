import { act, renderHook } from "@testing-library/react";
import { BehaviorSubject, Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { usePending } from "./usePending.js";

describe("usePending", () => {
  it("stays pending for a cold Subject", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => usePending(subject));
    expect(result.current.status).toBe("pending");
  });

  it("resolves to fulfilled for a BehaviorSubject", () => {
    const subject = new BehaviorSubject(42);
    const { result } = renderHook(() => usePending(subject));
    expect(result.current).toEqual({ status: "fulfilled", value: 42 });
  });

  it("treats a non-observable value as immediately fulfilled", () => {
    const { result } = renderHook(() => usePending<number>(123));
    expect(result.current).toEqual({ status: "fulfilled", value: 123 });
  });

  it("transitions to fulfilled when the source emits", () => {
    const subject = new Subject<string>();
    const { result } = renderHook(() => usePending(subject));
    act(() => subject.next("hi"));
    expect(result.current).toEqual({ status: "fulfilled", value: "hi" });
  });

  it("transitions to rejected with onReload when the source errors", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const subject = new Subject<number>();
    const { result } = renderHook(() => usePending(subject));
    const err = new Error("nope");
    act(() => subject.error(err));
    expect(result.current.status).toBe("rejected");
    if (result.current.status === "rejected") {
      expect(result.current.error).toBe(err);
      expect(typeof result.current.onReload).toBe("function");
    }
    consoleError.mockRestore();
  });
});
