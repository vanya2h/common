import { mainnet, optimism, polygon } from "viem/chains";
import { expectTypeOf } from "vitest";
import { createSupportedChains, SupportedChainIds } from "./supportedChainId.js";

const chains = [mainnet, optimism, polygon] as const;

describe("SupportedChainIds", () => {
  const schema = SupportedChainIds(chains);

  it("should parse a valid chain id", () => {
    expect(schema.parse("1")).toBe("1");
    expect(schema.parse("10")).toBe("10");
    expect(schema.parse("137")).toBe("137");
  });

  it("should reject an unsupported chain id", () => {
    expect(schema.safeParse("999").success).toBe(false);
  });

  it("should reject non-string values", () => {
    expect(schema.safeParse(1).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it("should infer the correct output type", () => {
    type Output = ReturnType<typeof schema.parse>;
    expectTypeOf<Output>().toEqualTypeOf<"1" | "10" | "137">();
  });
});

describe("createSupportedChains", () => {
  const supported = createSupportedChains(chains);

  it("should parse via Schema", () => {
    expect(supported.Schema.parse("1")).toBe("1");
    expect(supported.Schema.safeParse("999").success).toBe(false);
  });

  it("should expose chainIds", () => {
    expect(supported.chainIds).toEqual(["1", "10", "137"]);
  });

  it("should check isSupported", () => {
    expect(supported.isSupported("1")).toBe(true);
    expect(supported.isSupported("999")).toBe(false);
  });

  it("should get chain by id", () => {
    expect(supported.get("1").name).toBe("Ethereum");
    expect(supported.get("10").name).toBe("OP Mainnet");
  });

  it("should infer correct types", () => {
    type ChainId = (typeof supported.chainIds)[number];
    expectTypeOf<ChainId>().toEqualTypeOf<"1" | "10" | "137">();
  });

  it("should narrow the return type of get to a single chain", () => {
    const eth = supported.get("1");
    expectTypeOf(eth).toEqualTypeOf<(typeof chains)[0]>();
    expectTypeOf(eth.id).toEqualTypeOf<1>();

    const op = supported.get("10");
    expectTypeOf(op).toEqualTypeOf<(typeof chains)[1]>();
    expectTypeOf(op.id).toEqualTypeOf<10>();

    const poly = supported.get("137");
    expectTypeOf(poly).toEqualTypeOf<(typeof chains)[2]>();
    expectTypeOf(poly.id).toEqualTypeOf<137>();
  });
});
