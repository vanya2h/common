import { ObservableLike } from "@vanya2h/utils-rxjs";
import React from "react";
import { TruthyTypesOf } from "rxjs";
import { Pending } from "./Pending";

export type IOnlyIfTruthyProps<T> = {
  value$: ObservableLike<T>;
  children: ((val: TruthyTypesOf<T>) => React.ReactNode) | React.ReactNode;
};

export function OnlyIfTruthy<T>({ value$, children }: IOnlyIfTruthyProps<T>) {
  return (
    <Pending value$={value$}>
      {(x) => {
        if (x) {
          if (typeof children === "function") return children(x as TruthyTypesOf<T>);
          return children;
        }
        return null;
      }}
    </Pending>
  );
}
