import { TypedEmitter } from "tiny-typed-emitter";

type NonEmptyArray<T> = [T, ...T[]];

export type IActionMetadata = {
  title: string;
  description: string;
};

export type IAction<Key extends string = string, Input = any, Output = any> = {
  key: Key;
  metadata: IActionMetadata;
  start: (prev: Input) => Promise<Output>;
};

export type InferActionsResult<Actions extends IAction[], Output = never> = Actions extends [infer First, ...infer Rest]
  ? First extends IAction<string, any, infer Output>
    ? Rest extends NonEmptyArray<IAction>
      ? InferActionsResult<Rest, Output>
      : Output
    : never
  : Output;

export type IActionSetEvents<Actions extends IAction[]> = {
  nextAction: <Key extends number>(data: IActionSingle<Actions[Key]>, index: number) => void;
  result: (result: InferActionsResult<Actions>) => void;
};

export type InferActionInput<T extends IAction> = T extends IAction<string, infer Input> ? Input : never;

export type IActionSingle<Action extends IAction> = TypedEmitter<IActionEvents<Action>> & {
  action: Action;
  getStatus: () => IActionStatus<InferActionOutput<Action>>;
  reset: () => void;
  run: (input: InferActionInput<Action>) => Promise<InferActionOutput<Action>>;
};

export type InferActionOutput<Action extends IAction> =
  Action extends IAction<string, any, infer Output> ? Output : never;

export type IActionStatusFulfulled<T> = {
  type: "fulfilled";
  result: T;
};

export type IActionStatusRejected = {
  type: "rejected";
  error: unknown;
  retry: () => void;
};

export type IActionStatusPending = {
  type: "pending";
};

export type IActionStatusIdle = {
  type: "idle";
};

export type IActionStatus<T> =
  | IActionStatusFulfulled<T>
  | IActionStatusRejected
  | IActionStatusIdle
  | IActionStatusPending;

export type IActionState<Action extends IAction> = {
  action: Action;
  status: IActionStatus<Action>;
};

export type IActionEvents<T extends IAction> = {
  updateStatus: (status: IActionStatus<InferActionOutput<T>>) => void;
};
