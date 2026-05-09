import { noop } from "rxjs";
import { z } from "zod";
import { IFormFactory } from "./types";

export type IFormFactoryProps<TSchema extends z.ZodType<any, any, any>, TSeed> = {
  schema: TSchema;
  getDefaultData: (seed: TSeed) => z.input<TSchema>;
};

export function createFormFactory<TSchema extends z.ZodType<any, any, any>, TSeed>({
  schema,
  getDefaultData,
}: IFormFactoryProps<TSchema, TSeed>): IFormFactory<TSchema, TSeed> {
  return {
    schema: schema,
    createSubmitFn: <TResult>(submitFn: (value: z.output<TSchema>, seed: TSeed) => Promise<TResult>) => submitFn,
    build: ({ seed$, submitFn, onResult = noop, ...formProps }) => ({
      schema: schema,
      seed$: seed$,
      submitFn: submitFn,
      onResult: onResult,
      getDefaultData: getDefaultData,
      props: formProps,
    }),
  };
}

export function createFormStubFactory<TSeed>() {
  return createFormFactory({
    schema: z.object({}),
    getDefaultData: (_seed: TSeed) => ({}),
  });
}
