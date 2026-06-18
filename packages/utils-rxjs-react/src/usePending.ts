import { ObservableLike, toObservable } from "@vanya2h/utils-rxjs";
import _ from "lodash";
import { useMemo, useState } from "react";
import { BehaviorSubject, catchError, concat, distinctUntilChanged, map, of, switchMap } from "rxjs";
import { useObservable } from "./useObservable.js";

type Status = "pending" | "rejected" | "fulfilled";

export type IPendingStatus<T, K extends Status = Status> = {
  pending: {
    status: "pending";
  };
  rejected: {
    status: "rejected";
    error: unknown;
    onReload: () => void;
  };
  fulfilled: {
    status: "fulfilled";
    value: T;
  };
}[K];

export function usePending<T>(source$: ObservableLike<T>, getDefaultValue?: () => T): IPendingStatus<T> {
  const [nonce$] = useState(() => new BehaviorSubject(0));

  const target$ = useMemo(
    () =>
      nonce$.pipe(
        switchMap(() =>
          concat(
            of({ status: "pending" }),
            toObservable(source$).pipe(
              map((value) => ({
                status: "fulfilled",
                value: value,
              })),
              catchError((error) => {
                console.error(error);
                return of({
                  status: "rejected",
                  error: error,
                  onReload: () => nonce$.next(nonce$.getValue() + 1),
                });
              }),
            ),
          ),
        ),
        map((x) => x as IPendingStatus<T>),
        distinctUntilChanged(_.isEqual),
      ),
    [source$, nonce$],
  );

  const initialState = useMemo<IPendingStatus<T>>(() => {
    return getDefaultValue
      ? {
          status: "fulfilled",
          value: getDefaultValue(),
        }
      : {
          status: "pending",
        };
  }, [getDefaultValue]);

  return useObservable(target$, initialState);
}
