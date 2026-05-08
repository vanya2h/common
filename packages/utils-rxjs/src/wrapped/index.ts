import { BehaviorSubject, EMPTY, Observable, of, shareReplay, switchMap } from "rxjs";

export enum StatusEnum {
  IDLE = "IDLE",
  PENDING = "PENDING",
  FULFILLED = "FULFILLED",
  REJECTED = "REJECTED",
}

export type IWrapped<Args extends any[], Result, K extends StatusEnum = StatusEnum> = {
  [StatusEnum.IDLE]: {
    type: StatusEnum.IDLE;
  };
  [StatusEnum.PENDING]: {
    type: StatusEnum.PENDING;
    args: Args;
  };
  [StatusEnum.FULFILLED]: {
    type: StatusEnum.FULFILLED;
    args: Args;
    value: Result;
  };
  [StatusEnum.REJECTED]: {
    type: StatusEnum.REJECTED;
    args: Args;
    error: unknown;
  };
}[K] & {
  type: K;
};

export function createIdle<Args extends any[], Result>(): IWrapped<Args, Result, StatusEnum.IDLE> {
  return {
    type: StatusEnum.IDLE,
  };
}

export function createPending<Args extends any[], Result>(args: Args): IWrapped<Args, Result, StatusEnum.PENDING> {
  return {
    type: StatusEnum.PENDING,
    args,
  };
}

export function createFulfilled<Args extends any[], Result>(
  args: Args,
  value: Result,
): IWrapped<Args, Result, StatusEnum.FULFILLED> {
  return {
    type: StatusEnum.FULFILLED,
    value,
    args,
  };
}

export function createRejected<Args extends any[], Result>(
  args: Args,
  error: unknown,
): IWrapped<Args, Result, StatusEnum.REJECTED> {
  return {
    type: StatusEnum.REJECTED,
    error,
    args,
  };
}

export type IWrappedPromise<Args extends any[], Result> = {
  status$: Observable<IWrapped<Args, Result>>;
  result$: Observable<Result>;
  reset: () => void;
  run: (...args: Args) => Promise<Result>;
};

export function createWrappedPromise<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
): IWrappedPromise<Args, Result> {
  const status$ = new BehaviorSubject<IWrapped<Args, Result>>(createIdle());
  return {
    status$: status$,
    result$: status$.pipe(
      switchMap((x) => (x.type === StatusEnum.FULFILLED ? of(x.value) : EMPTY)),
      shareReplay(1),
    ),
    reset: () => status$.next(createIdle()),
    run: async (...args: Args) => {
      status$.next(createPending(args));
      try {
        const val = await fn(...args);
        status$.next(createFulfilled(args, val));
        return val;
      } catch (error) {
        status$.next(createRejected(args, error));
        throw error;
      }
    },
  };
}
