import { BehaviorSubject, identity, Observable, of, shareReplay, switchMap, take } from "rxjs";

export type ICache<T> = {
  next: () => Observable<T>;
  set: (val: T) => void;
  fresh: () => Observable<T>;
  value$: Observable<T>;
};

export function createCache<T>(buildSource: () => Observable<T>, defaultValue$?: Observable<T>): ICache<T> {
  const createFromSource = () =>
    of(null).pipe(
      switchMap(() => buildSource()),
      shareReplay(1),
    );
  const source$ = new BehaviorSubject(defaultValue$ ?? createFromSource());
  const value$ = source$.pipe(switchMap(identity), shareReplay(1));

  const next = () => {
    const obs = createFromSource();
    source$.next(obs);
    return obs.pipe(take(1));
  };

  return {
    fresh: () => {
      const obs = createFromSource();
      source$.next(obs);
      return obs;
    },
    value$: value$,
    next: next,
    set: (value: T) => {
      const obs = of(value);
      source$.next(obs);
    },
  };
}
