import { useCallback, useRef, useSyncExternalStore } from "react";
import { Observable } from "rxjs";

export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const valueRef = useRef<T>(initialValue);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const sub = observable.subscribe({
        next: (value) => {
          valueRef.current = value;
          onChange();
        },
      });
      return () => sub.unsubscribe();
    },
    [observable],
  );

  return useSyncExternalStore(subscribe, () => valueRef.current);
}
