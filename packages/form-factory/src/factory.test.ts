import { BehaviorSubject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createFormFactory, createFormStubFactory } from "./factory.js";

const schema = z.object({ name: z.string().min(1) });
const seed$ = new BehaviorSubject({ userId: "u1" });

describe("createFormFactory", () => {
  it("returns factory with correct schema", () => {
    const factory = createFormFactory({ schema, getDefaultData: () => ({ name: "" }) });
    expect(factory.schema).toBe(schema);
  });

  it("build() returns IFormInstance with all required fields", () => {
    const factory = createFormFactory({
      schema,
      getDefaultData: (seed: { userId: string }) => ({ name: seed.userId }),
    });
    const submitFn = vi.fn().mockResolvedValue(undefined);
    const onResult = vi.fn();

    const instance = factory.build({ seed$, submitFn, onResult });

    expect(instance.schema).toBe(schema);
    expect(instance.seed$).toBe(seed$);
    expect(instance.submitFn).toBe(submitFn);
    expect(instance.onResult).toBe(onResult);
    expect(instance.getDefaultData({ userId: "u1" } as { userId: string })).toEqual({ name: "u1" });
  });

  it("build() uses noop when onResult is omitted", () => {
    const factory = createFormFactory({ schema, getDefaultData: () => ({ name: "" }) });
    const instance = factory.build({ seed$, submitFn: vi.fn() });
    expect(() => instance.onResult("result")).not.toThrow();
  });

  it("createSubmitFn is an identity pass-through for type inference", () => {
    const factory = createFormFactory({ schema, getDefaultData: () => ({ name: "" }) });
    const fn = vi.fn().mockResolvedValue("ok");
    const wrapped = factory.createSubmitFn(fn);
    expect(wrapped).toBe(fn);
  });
});

describe("createFormStubFactory", () => {
  it("creates a factory with an empty schema", () => {
    const factory = createFormStubFactory<{ id: string }>();
    expect(factory.schema).toBeDefined();
    const instance = factory.build({ seed$: new BehaviorSubject({ id: "x" }), submitFn: vi.fn() });
    expect(instance.getDefaultData({ id: "x" })).toEqual({});
  });
});
