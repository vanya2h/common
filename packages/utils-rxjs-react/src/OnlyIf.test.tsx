import { render as rtlRender, screen } from "@testing-library/react";
import { BehaviorSubject } from "rxjs";
import { describe, expect, it } from "vitest";
import { OnlyIfTruthy } from "./OnlyIf.js";

describe("OnlyIfTruthy", () => {
  it("renders the function child with the truthy value", () => {
    const subject = new BehaviorSubject<number | null>(5);
    rtlRender(<OnlyIfTruthy value$={subject}>{(v) => <span data-testid="v">{v}</span>}</OnlyIfTruthy>);
    expect(screen.getByTestId("v").textContent).toBe("5");
  });

  it("renders nothing when the value is falsy", () => {
    const subject = new BehaviorSubject<number | null>(null);
    const { container } = rtlRender(
      <OnlyIfTruthy value$={subject}>{(v) => <span data-testid="v">{v}</span>}</OnlyIfTruthy>,
    );
    expect(container.textContent).toBe("");
  });

  it("renders a static ReactNode child when truthy", () => {
    const subject = new BehaviorSubject(true);
    rtlRender(
      <OnlyIfTruthy value$={subject}>
        <span data-testid="static">yes</span>
      </OnlyIfTruthy>,
    );
    expect(screen.getByTestId("static").textContent).toBe("yes");
  });

  it("renders nothing when the static-child case is given a falsy value", () => {
    const subject = new BehaviorSubject<string>("");
    const { container } = rtlRender(
      <OnlyIfTruthy value$={subject}>
        <span data-testid="static">yes</span>
      </OnlyIfTruthy>,
    );
    expect(container.textContent).toBe("");
  });
});
