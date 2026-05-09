import { useEffect, useState } from "react";
import { Observable } from "rxjs";

export type IObservableState<T> =
  | { status: "pending" }
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; error: unknown };

/**
 * Subscribe to an observable and track its first emission.
 * Returns `pending` until the first value, `fulfilled` after, `rejected` on error.
 *
 * Synchronous emissions (e.g. BehaviorSubject) resolve to `fulfilled` on first render.
 */
export function useObservableValue<T>(source$: Observable<T>): IObservableState<T> {
  const [state, setState] = useState<IObservableState<T>>(() => {
    let initial: IObservableState<T> = { status: "pending" };
    const sub = source$.subscribe({
      next: (value) => {
        initial = { status: "fulfilled", value: value };
      },
      error: (error) => {
        initial = { status: "rejected", error: error };
      },
    });
    sub.unsubscribe();
    return initial;
  });

  useEffect(() => {
    const sub = source$.subscribe({
      next: (value) => setState({ status: "fulfilled", value: value }),
      error: (error) => setState({ status: "rejected", error: error }),
    });
    return () => sub.unsubscribe();
  }, [source$]);

  return state;
}
