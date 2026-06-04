// packages/ui/src/cn.test.ts — className combiner. หอมฉลุย — Powered by 2T9COME.
import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy fragments with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", 0, "b")).toBe("a b");
  });

  it("supports conditional classes", () => {
    const active = true;
    const disabled = false;
    expect(cn("base", active && "on", disabled && "off")).toBe("base on");
  });
});
