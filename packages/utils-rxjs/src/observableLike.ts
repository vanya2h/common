import { isObservable, Observable, of } from "rxjs";

export type ObservableLike<T> = Observable<T> | T;

export function toObservable<T>(val: ObservableLike<T>): Observable<T> {
  if (isObservable(val)) return val;
  return of(val);
}
