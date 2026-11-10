import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActive } from "./nav-items";

describe("nav", () => {
  it("lists the three routes", () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual(["/", "/transactions", "/transfers"]);
  });

  it("marks only the matching route active", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/transfers", "/")).toBe(false);
    expect(isActive("/transfers", "/transfers")).toBe(true);
  });
});
