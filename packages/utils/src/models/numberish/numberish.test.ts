import { z } from "zod";
import { NumberishSchema, StringNumberSchema } from "./numberish.js";

describe("numberish", () => {
  it("should parse numeric string", () => {
    expect(NumberishSchema.pipe(z.coerce.bigint()).parse("1")).toEqual(BigInt(1));
  });

  it("should parse numeric bigint", () => {
    expect(NumberishSchema.pipe(z.coerce.bigint()).parse(BigInt(1))).toEqual(BigInt(1));
  });

  it("should parse number", () => {
    expect(NumberishSchema.pipe(z.coerce.bigint()).parse(1)).toEqual(BigInt(1));
  });

  it("should return error when not a numeric value", () => {
    expect(NumberishSchema.pipe(z.coerce.bigint()).safeParse("s")).toMatchInlineSnapshot(`
      {
        "error": [ZodError: [
        {
          "expected": "bigint",
          "code": "invalid_type",
          "path": [],
          "message": "Invalid input: expected bigint, received string"
        }
      ]],
        "success": false,
      }
    `);
  });
});

describe("StringNumberSchema", () => {
  it("should parse an integer string", () => {
    expect(StringNumberSchema.parse("42")).toBe(42);
  });

  it("should parse a decimal string with dot", () => {
    expect(StringNumberSchema.parse("3.14")).toBe(3.14);
  });

  it("should parse a decimal string with comma", () => {
    expect(StringNumberSchema.parse("3,14")).toBe(3.14);
  });

  it("should parse a negative number string", () => {
    expect(StringNumberSchema.parse("-10")).toBe(-10);
  });

  it("should parse zero", () => {
    expect(StringNumberSchema.parse("0")).toBe(0);
  });

  it("should reject non-numeric strings", () => {
    expect(StringNumberSchema.safeParse("abc")).toMatchObject({
      success: false,
    });
  });

  it("should parse empty string as 0", () => {
    expect(StringNumberSchema.parse("")).toBe(0);
  });

  it("should reject a number input", () => {
    expect(StringNumberSchema.safeParse(42)).toMatchObject({
      success: false,
    });
  });
});
