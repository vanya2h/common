import { useFormState } from "react-hook-form";

export type ISubmitState = {
  isValidating: boolean;
  isSubmitting: boolean;
  /** Convenience: `isValidating || isSubmitting` */
  disabled: boolean;
};

/**
 * Returns submit-relevant form state for the nearest FormProvider.
 * Wire this into your custom submit button.
 */
export function useSubmitState(): ISubmitState {
  const { isValidating, isSubmitting } = useFormState();
  return {
    isValidating: isValidating,
    isSubmitting: isSubmitting,
    disabled: isValidating || isSubmitting,
  };
}
