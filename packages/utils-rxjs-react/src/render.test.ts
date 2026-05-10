import { describe, expect, it, vi } from "vitest";
import { render } from "./render.js";

describe("render", () => {
  it("returns a static ReactNode renderable as-is", () => {
    expect(render(undefined as never, "hello")).toBe("hello");
    expect(render(undefined as never, null)).toBe(null);
  });

  it("invokes a function renderable with the data", () => {
    const fn = vi.fn((n: number) => `n=${n}`);
    expect(render(7, fn)).toBe("n=7");
    expect(fn).toHaveBeenCalledWith(7);
  });
});
