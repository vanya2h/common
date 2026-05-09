import { zodResolver } from "@hookform/resolvers/zod";
import { CancelError } from "p-cancelable";
import { SubmitEvent, useCallback, useMemo } from "react";
import { FieldError, Resolver, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { IFormBaseProps, IFormInstance } from "./types";

export type IUseFormFactoryOptions<
  TSchema extends z.ZodType<any, any, any>,
  TResult,
  TSeed,
> = IFormBaseProps<TSchema> & {
  instance: IFormInstance<TSchema, TResult, TSeed>;
  seed: TSeed;
  onResult?: (value: TResult) => void;
  /**
   * Convert a thrown submit error to a string. Wired into RHF's `root` error.
   * Defaults to `error.message ?? String(error)`.
   */
  parseErrorMessage?: (error: unknown) => string;
};

export type IUseFormFactoryResult<TSchema extends z.ZodType<any, any, any>, TResult, TSeed> = {
  form: UseFormReturn<z.input<TSchema>>;
  seed: TSeed;
  instance: IFormInstance<TSchema, TResult, TSeed>;
  /** Wire to a `<form onSubmit>`. Stops propagation, runs validation, runs `submitFn`. */
  handleSubmit: (event?: SubmitEvent) => void;
  /** Convenience access to the current `root` form error (or undefined). */
  rootError: FieldError | undefined;
};

const defaultParseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
};

/**
 * Wires a form `instance` (built from a factory) to react-hook-form.
 *
 * Caller is responsible for resolving the seed first — use `<Form>` if you
 * want the seed observable to be gated for you.
 */
export function useFormFactory<TSchema extends z.ZodType<any, any, any>, TResult, TSeed>({
  instance,
  seed,
  onResult,
  parseErrorMessage = defaultParseErrorMessage,
  ...restProps
}: IUseFormFactoryOptions<TSchema, TResult, TSeed>): IUseFormFactoryResult<TSchema, TResult, TSeed> {
  const resolver = useMemo(
    () => zodResolver(instance.schema, undefined, { mode: "async" }) as Resolver<z.input<TSchema>>,
    [instance],
  );

  const form = useForm<z.input<TSchema>>({
    resolver: resolver,
    reValidateMode: "onChange",
    defaultValues: instance.getDefaultData(seed),
    ...restProps,
    ...instance.props,
  });

  const handleResult = useCallback(
    (result: TResult) => {
      onResult?.(result);
      instance.onResult(result);
    },
    [onResult, instance],
  );

  const handleSubmit = useCallback(
    (event?: SubmitEvent) => {
      event?.stopPropagation();
      event?.preventDefault();

      void form.handleSubmit(
        (value) =>
          instance
            .submitFn(value as z.output<TSchema>, seed)
            .then(handleResult)
            .catch((error) => {
              if (error instanceof CancelError) {
                return null;
              }
              console.error(error);
              form.setError("root", { message: parseErrorMessage(error) });
              return null;
            }),
        (error) => console.error(error),
      )(event);
    },
    [form, instance, seed, handleResult, parseErrorMessage],
  );

  return {
    form: form,
    seed: seed,
    instance: instance,
    handleSubmit: handleSubmit,
    rootError: form.formState.errors.root as FieldError | undefined,
  };
}
