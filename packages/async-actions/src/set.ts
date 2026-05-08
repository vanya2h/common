import { List } from "immutable";
import { TypedEmitter } from "tiny-typed-emitter";
import { ActionSingle } from "./action.js";
import { IAction, IActionSetEvents, IActionSingle, InferActionInput, InferActionsResult } from "./types.js";

export class ActionsSet<Actions extends IAction[] = IAction[]> extends TypedEmitter<IActionSetEvents<Actions>> {
  readonly actions: Actions;
  readonly state: List<IActionSingle<Actions[number]>>;
  private currentAction: IActionSingle<Actions[number]>;
  private input: InferActionInput<Actions[0]> | null = null;
  private result: InferActionsResult<Actions> | null = null;

  static startWith = <Key extends string, Input, Output>(action: IAction<Key, Input, Output>) => {
    return new ActionsSet([action] as const);
  };

  constructor(actions: Actions) {
    super();
    this.actions = actions;
    this.state = List(actions.map((x) => new ActionSingle(x, () => this.retry())));
    const firstAction = this.state.get(0);
    if (!firstAction) {
      throw new Error("ActionsSet can't be empty");
    }
    this.currentAction = firstAction;
  }

  prepend = <Key extends string, Input extends InferActionsResult<Actions>, Output>(
    action: IAction<Key, Input, Output>,
  ): ActionsSet<[IAction<Key, Input, Output>, ...Actions]> => {
    return new ActionsSet([action, ...this.actions]);
  };

  pipe = <Key extends string, Input extends InferActionsResult<Actions>, Output>(
    action: IAction<Key, Input, Output>,
  ): ActionsSet<[...Actions, IAction<Key, Input, Output>]> => {
    return new ActionsSet([...this.actions, action]);
  };

  getResult = () => this.result;
  getCurrentAction = () => this.currentAction;
  getState = () => this.state;

  /**
   * Runs the actions list one by one starting from:
   * 1. 0 index (cold start case)
   * 2. last failed index (some action was rejected earlier case)
   *
   * @returns the result or output of last action (type can be inferred from actions set)
   */

  run = async (input: InferActionInput<Actions[0]>, cleanStart = false): Promise<InferActionsResult<Actions>> => {
    this.input = input;
    if (cleanStart) {
      this.state.map((x) => x.reset());
    }

    const output = await this.state.reduce(async (prev, curr, index) => {
      const context = await prev;
      this.nextAction(curr, index);
      const result = await curr.run(context);
      return result as InferActionsResult<Actions>;
    }, Promise.resolve(input));

    const result = output as InferActionsResult<Actions>;
    this.settleResult(result);
    return result;
  };

  retry = () => {
    if (this.input) {
      return this.run(this.input);
    }
    throw new Error("ActionsSet can't retry because no input is registered yet");
  };

  private nextAction(action: IActionSingle<Actions[number]>, index: number) {
    this.currentAction = action;
    this.emit("nextAction", action, index);
  }

  private settleResult(result: InferActionsResult<Actions>) {
    this.result = result;
    this.emit("result", result);
  }
}
