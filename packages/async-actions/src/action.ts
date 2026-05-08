import { TypedEmitter } from "tiny-typed-emitter";
import {
  IAction,
  IActionEvents,
  IActionSingle,
  IActionStatus,
  IActionStatusFulfulled,
  IActionStatusIdle,
  IActionStatusPending,
  IActionStatusRejected,
  InferActionInput,
  InferActionOutput,
} from "./types.js";

export class ActionSingle<Action extends IAction>
  extends TypedEmitter<IActionEvents<Action>>
  implements IActionSingle<Action>
{
  private status: IActionStatus<InferActionOutput<Action>> = createIdle();
  private promise: Promise<InferActionOutput<Action>> | null = null;

  constructor(
    public readonly action: Action,
    private readonly retry: () => void,
  ) {
    super();
  }

  getStatus = () => this.status;
  reset = () => (this.status = createIdle());

  run = async (input: InferActionInput<Action>, freshStart = false): Promise<InferActionOutput<Action>> => {
    if (freshStart) {
      this.reset();
    }

    switch (this.status.type) {
      case "idle":
      case "rejected": {
        this.updateStatus(createPending());
        try {
          const promise = this.action.start(input);
          this.promise = promise;
          const next = await promise;
          this.updateStatus(createFulfilled(next));
          return next;
        } catch (cause) {
          this.updateStatus(createRejected(cause, () => this.retry()));
          throw cause;
        }
      }
      case "fulfilled":
        return this.status.result;
      case "pending": {
        if (this.promise) {
          return this.promise;
        }
        throw new Error("Should never happen");
      }
      default:
        throw new Error("Should never happen");
    }
  };

  private updateStatus(next: IActionStatus<InferActionOutput<Action>>) {
    this.emit("updateStatus", next);
    this.status = { ...next };
  }
}

function createIdle(): IActionStatusIdle {
  return { type: "idle" };
}

function createPending(): IActionStatusPending {
  return { type: "pending" };
}

function createRejected(cause: unknown, onRetry: () => void): IActionStatusRejected {
  return {
    type: "rejected",
    error: cause,
    retry: onRetry,
  };
}

function createFulfilled<T>(result: T): IActionStatusFulfulled<T> {
  return { type: "fulfilled", result: result };
}
