import { act, render as rtlRender, screen } from "@testing-library/react";
import { BehaviorSubject, Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { BehaviorSubjectRender, Pending } from "./Pending.js";

describe("Pending", () => {
  it("renders nothing while pending without a placeholder", () => {
    const subject = new Subject<string>();
    const { container } = rtlRender(<Pending value$={subject}>{(v) => <span>{v}</span>}</Pending>);
    expect(container.textContent).toBe("");
  });

  it("renders the pending placeholder when set", () => {
    const subject = new Subject<string>();
    rtlRender(
      <Pending value$={subject} pending={<span data-testid="loading">loading</span>}>
        {(v) => <span>{v}</span>}
      </Pending>,
    );
    expect(screen.getByTestId("loading").textContent).toBe("loading");
  });

  it("renders children with the value when fulfilled", () => {
    const subject = new BehaviorSubject("hello");
    rtlRender(<Pending value$={subject}>{(v) => <span data-testid="v">{v}</span>}</Pending>);
    expect(screen.getByTestId("v").textContent).toBe("hello");
  });

  it("re-renders when the source emits a new value", () => {
    const subject = new BehaviorSubject("a");
    rtlRender(<Pending value$={subject}>{(v) => <span data-testid="v">{v}</span>}</Pending>);
    act(() => subject.next("b"));
    expect(screen.getByTestId("v").textContent).toBe("b");
  });

  it("renders the rejected branch when the source errors", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const subject = new Subject<number>();
    rtlRender(
      <Pending value$={subject} rejected={(s) => <span data-testid="err">{(s.error as Error).message}</span>}>
        {(v) => <span>{v}</span>}
      </Pending>,
    );
    act(() => subject.error(new Error("boom")));
    expect(screen.getByTestId("err").textContent).toBe("boom");
    consoleError.mockRestore();
  });
});

describe("BehaviorSubjectRender", () => {
  it("renders the initial buffered value", () => {
    const subject = new BehaviorSubject("a");
    rtlRender(
      <BehaviorSubjectRender value$={subject}>{(v) => <span data-testid="v">{v}</span>}</BehaviorSubjectRender>,
    );
    expect(screen.getByTestId("v").textContent).toBe("a");
  });

  it("re-renders when the subject emits", () => {
    const subject = new BehaviorSubject("a");
    rtlRender(
      <BehaviorSubjectRender value$={subject}>{(v) => <span data-testid="v">{v}</span>}</BehaviorSubjectRender>,
    );
    act(() => subject.next("b"));
    expect(screen.getByTestId("v").textContent).toBe("b");
  });

  it("renders a static ReactNode child", () => {
    const subject = new BehaviorSubject("a");
    rtlRender(
      <BehaviorSubjectRender value$={subject}>
        <span data-testid="static">static</span>
      </BehaviorSubjectRender>,
    );
    expect(screen.getByTestId("static").textContent).toBe("static");
  });
});
