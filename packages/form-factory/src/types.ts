import { UseFormProps } from "react-hook-form";
import { Observable } from "rxjs";
import { z } from "zod";

export type IFormBaseProps<TSchema extends z.ZodType<any, any, any>> = UseFormProps<z.input<TSchema>>;

export type IFormInstance<TSchema extends z.ZodType<any, any, any>, TResult, TSeed> = {
  submitFn: (value: z.output<TSchema>, seed: TSeed) => Promise<TResult>;
  onResult: (result: TResult) => void;
  getDefaultData: (seed: TSeed) => z.input<TSchema>;
  props: IFormBaseProps<TSchema>;
  seed$: Observable<TSeed>;
  schema: TSchema;
};

export type IFormFactoryBuildProps<
  TSchema extends z.ZodType<any, any, any>,
  TResult,
  TSeed,
> = IFormBaseProps<TSchema> & {
  seed$: Observable<TSeed>;
  submitFn: (value: z.output<TSchema>, seed: TSeed) => Promise<TResult>;
  onResult?: (result: TResult) => void;
};

export type IFormFactory<TSchema extends z.ZodType<any, any, any>, TSeed> = {
  schema: TSchema;
  build: <TResult>(props: IFormFactoryBuildProps<TSchema, TResult, TSeed>) => IFormInstance<TSchema, TResult, TSeed>;
  createSubmitFn: <TResult>(
    submitFn: (value: z.output<TSchema>, seed: TSeed) => Promise<TResult>,
  ) => (value: z.output<TSchema>, seed: TSeed) => Promise<TResult>;
};
