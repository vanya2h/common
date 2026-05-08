import { ActionsSet } from "./set.js";

const identity = <T>(x: T): T => x;

describe("action", () => {
  const booleanToString = vi.fn((input: boolean) => Promise.resolve(`${input}`));
  const toStringAction = {
    key: "to-string",
    metadata: {
      title: "",
      description: "",
    },
    start: booleanToString,
  };

  const stringToCapitalized = vi.fn((input: string) => Promise.resolve(input.toUpperCase()));
  const toCapitalizedAction = {
    key: "to-capitalized",
    metadata: {
      title: "",
      description: "",
    },
    start: stringToCapitalized,
  };

  beforeEach(() => {
    stringToCapitalized.mockClear();
    booleanToString.mockClear();
  });

  it("should go through all the actions and return final output", async () => {
    const actions = ActionsSet.startWith(toStringAction).pipe(toCapitalizedAction);

    const resultFn = vi.fn(identity);
    actions.on("result", resultFn);
    const result1 = await actions.run(true);
    expect(result1).toEqual("TRUE");
    expect(stringToCapitalized.mock.calls.length).toEqual(1);
    expect(booleanToString.mock.calls.length).toEqual(1);
    expect(resultFn.mock.results.length).toEqual(1);
    expect(resultFn.mock.results[0]?.value).toEqual(result1);
    const result2 = await actions.run(true);
    expect(result2).toEqual("TRUE");
    expect(stringToCapitalized.mock.calls.length).toEqual(1);
    expect(booleanToString.mock.calls.length).toEqual(1);
    expect(resultFn.mock.results.length).toEqual(2);
    expect(resultFn.mock.results[1]?.value).toEqual(result2);
  });

  it("should reset state if clean start", async () => {
    const actions = new ActionsSet([toStringAction, toCapitalizedAction] as const);
    const result1 = await actions.run(true);
    expect(result1).toEqual("TRUE");
    expect(stringToCapitalized.mock.calls.length).toEqual(1);
    expect(booleanToString.mock.calls.length).toEqual(1);
    const result2 = await actions.run(false, true);
    expect(result2).toEqual("FALSE");
    expect(stringToCapitalized.mock.calls.length).toEqual(2);
    expect(booleanToString.mock.calls.length).toEqual(2);
  });

  it("should emit nextAction event", async () => {
    const actions = new ActionsSet([toStringAction, toCapitalizedAction] as const);
    const collected = [];
    actions.on("nextAction", (x) => collected.push(x));
    await actions.run(true);
    expect(collected.length).toEqual(2);
  });

  it("should start from failed action", async () => {
    const actionFn = vi.fn((input: string): Promise<string> => Promise.reject(new Error(input)));
    const action = {
      key: "some-action",
      metadata: {
        title: "",
        description: "",
      },
      start: actionFn,
    };

    const actions = ActionsSet.startWith(toStringAction).pipe(action).pipe(toCapitalizedAction);
    await expect(actions.run(true)).rejects.toThrowError();
    expect(booleanToString.mock.calls.length).toEqual(1);
    expect(stringToCapitalized.mock.calls.length).toEqual(0);

    actionFn.mockReset().mockImplementation((x: string) => Promise.resolve(x));
    const result = await actions.run(true);
    expect(result).toEqual("TRUE");
    expect(booleanToString.mock.calls.length).toEqual(1);
    expect(stringToCapitalized.mock.calls.length).toEqual(1);
  });

  // Tests for type-definitions and inferring

  it("should infer the actions result from the action list", () => {
    const actions = ActionsSet.startWith(toStringAction).pipe(toCapitalizedAction);
    expectTypeOf(actions.run).returns.toMatchTypeOf<Promise<string>>();
  });

  it("should infer first arguments as input", () => {
    const actions = ActionsSet.startWith(toStringAction).pipe(toCapitalizedAction);
    expectTypeOf(actions.run).parameter(0).toBeBoolean();
  });
});
