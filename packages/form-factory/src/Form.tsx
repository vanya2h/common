import { ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";
import { IFormFactory, IFormInstance } from "./types";
import { IUseFormFactoryOptions, IUseFormFactoryResult, useFormFactory } from "./useFormFactory";
import { useObservableValue } from "./useObservableValue";

export type IFormRenderProps<TSchema extends z.ZodType<any, any, any>, TResult, TSeed> = IUseFormFactoryResult<
  TSchema,
  TResult,
  TSeed
>;

export type IFormProps<TSchema extends z.ZodType<any, any, any>, TResult, TSeed> = Omit<
  IUseFormFactoryOptions<TSchema, TResult, TSeed>,
  "seed"
> & {
  /** Render prop. Receives form, seed, instance, handleSubmit, rootError. */
  children: (props: IFormRenderProps<TSchema, TResult, TSeed>) => ReactNode;
  /** Rendered while seed observable has not emitted its first value. Default: null. */
  pending?: ReactNode;
  /** Rendered if seed observable emits an error. Default: null. */
  rejected?: (error: unknown) => ReactNode;
};

/**
 * Headless form root. Gates rendering on the seed observable, then wires
 * `useFormFactory` and provides `<FormProvider>` context.
 *
 * No DOM, no styling, no error dialog — bring your own UI.
 *
 * ```tsx
 * <Form instance={instance}>
 *   {({ form, handleSubmit, rootError }) => (
 *     <form onSubmit={handleSubmit}>
 *       <MyFields control={form.control} />
 *       {rootError && <MyErrorBanner error={rootError} />}
 *       <MySubmitButton />
 *     </form>
 *   )}
 * </Form>
 * ```
 */
export function Form<TSchema extends z.ZodType<any, any, any>, TResult, TSeed>({
  instance,
  children,
  pending = null,
  rejected = () => null,
  ...rest
}: IFormProps<TSchema, TResult, TSeed>) {
  const seedState = useObservableValue(instance.seed$);

  if (seedState.status === "pending") return <>{pending}</>;
  if (seedState.status === "rejected") return <>{rejected(seedState.error)}</>;

  return (
    <FormBody instance={instance} seed={seedState.value} {...rest}>
      {children}
    </FormBody>
  );
}

type IFormBodyProps<TSchema extends z.ZodType<any, any, any>, TResult, TSeed> = IUseFormFactoryOptions<
  TSchema,
  TResult,
  TSeed
> & {
  children: (props: IFormRenderProps<TSchema, TResult, TSeed>) => ReactNode;
};

function FormBody<TSchema extends z.ZodType<any, any, any>, TResult, TSeed>({
  children,
  ...options
}: IFormBodyProps<TSchema, TResult, TSeed>) {
  const result = useFormFactory(options);
  return <FormProvider {...result.form}>{children(result)}</FormProvider>;
}

// Type-level utils — preserved from the original module for callers that
// derive component prop types from a factory.

export type GetFormComponentProps<TFormFactory, TResult> =
  TFormFactory extends IFormFactory<infer TSchema, infer TSeed>
    ? Omit<IFormProps<TSchema, TResult, TSeed>, "children">
    : never;

export type InferFormRenderProps<TFormFactory, TResult = unknown> =
  TFormFactory extends IFormFactory<infer TSchema, infer TSeed> ? IFormRenderProps<TSchema, TResult, TSeed> : never;

export type IFormInstanceFromFactory<TFormFactory, TResult> =
  TFormFactory extends IFormFactory<infer TSchema, infer TSeed> ? IFormInstance<TSchema, TResult, TSeed> : never;
