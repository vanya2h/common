import { act, renderHook } from "@testing-library/react";
import { BehaviorSubject, Subject } from "rxjs";
import { describe, expect, it } from "vitest";
import { useObservableValue } from "./useObservableValue.js";

describe("useObservableValue", () => {
  it("resolves BehaviorSubject synchronously to fulfilled", () => {
    const subject = new BehaviorSubject(42);
    const { result } = renderHook(() => useObservableValue(subject));
    expect(result.current).toEqual({ status: "fulfilled", value: 42 });
  });

  it("starts as pending for a cold Subject", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => useObservableValue(subject));
    expect(result.current).toEqual({ status: "pending" });
  });

  it("transitions to fulfilled when the observable emits", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => useObservableValue(subject));
    act(() => subject.next(99));
    expect(result.current).toEqual({ status: "fulfilled", value: 99 });
  });

  it("transitions to rejected when the observable errors", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => useObservableValue(subject));
    const err = new Error("boom");
    act(() => subject.error(err));
    expect(result.current).toEqual({ status: "rejected", error: err });
  });
});
