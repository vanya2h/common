import { act, renderHook } from "@testing-library/react";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { describe, expect, it } from "vitest";
import { useObservable } from "./useObservable.js";

describe("useObservable", () => {
  it("returns the initial value when the source has not emitted", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => useObservable(subject, 0));
    expect(result.current).toBe(0);
  });

  it("resolves to the buffered value of a BehaviorSubject after mount", () => {
    const subject = new BehaviorSubject(42);
    const { result } = renderHook(() => useObservable(subject, 0));
    expect(result.current).toBe(42);
  });

  it("re-renders when the source emits a new value", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => useObservable(subject, 0));
    act(() => subject.next(7));
    expect(result.current).toBe(7);
    act(() => subject.next(8));
    expect(result.current).toBe(8);
  });

  it("unsubscribes on unmount", () => {
    let active = 0;
    const obs = new Observable<number>(() => {
      active++;
      return () => {
        active--;
      };
    });
    const { unmount } = renderHook(() => useObservable(obs, 0));
    expect(active).toBe(1);
    unmount();
    expect(active).toBe(0);
  });

  it("returns undefined before the source emits when no initialValue is given", () => {
    const subject = new Subject<number>();
    const { result } = renderHook(() => useObservable(subject));
    expect(result.current).toBeUndefined();
    act(() => subject.next(5));
    expect(result.current).toBe(5);
  });

  it("resubscribes when the observable identity changes", () => {
    const a = new BehaviorSubject(1);
    const b = new BehaviorSubject(2);
    const { result, rerender } = renderHook(({ src }) => useObservable(src, 0), {
      initialProps: { src: a },
    });
    expect(result.current).toBe(1);
    rerender({ src: b });
    expect(result.current).toBe(2);
  });
});
