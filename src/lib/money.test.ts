import { describe, expect, it } from "vitest";
import {
  centsToInputValue, formatCents, formatCompactCents, formatSignedCents, formatWholeDollars,
  parseAmountInput, parseAmountToCents, sumBy, sumCents,
} from "./money";

describe("parseAmountToCents", () => {
  it.each([
    ["1", 100], ["1.5", 150], ["1.50", 150], ["0.01", 1], ["1.", 100], ["1,250", 125000],
    ["1,250.5", 125050], ["$1,250.00", 125000], ["  42.10  ", 4210], ["0.10", 10], ["19.99", 1999],
    ["1234567890.99", 123456789099], ["007", 700],
  ])("accepts %j -> %j", (input, cents) => expect(parseAmountToCents(input)).toBe(cents));

  it("is exact where floats are not (0.1 + 0.2 style)", () => {
    expect(parseAmountToCents("0.29")).toBe(29);
    expect(parseAmountToCents("1.15")).toBe(115);
    expect(parseAmountToCents("4.35")).toBe(435);
    expect(parseAmountToCents("8.2")).toBe(820);
  });

  it.each(["", "   ", "abc", "NaN", "Infinity", "1e3", "0x10", "1.2.3", "$", "--1", "1,23", "1,2345", ",100", "1 000", "12abc", "€5", "+5", "1,00,000", ".5"])(
    "rejects junk %j", (input) => expect(parseAmountToCents(input)).toBeNull());

  it("rejects more than two decimals (no rounding)", () => {
    expect(parseAmountInput("1.234")).toEqual({ ok: false, reason: "precision" });
    expect(parseAmountInput("0.001")).toEqual({ ok: false, reason: "precision" });
    expect(parseAmountInput("5.100")).toEqual({ ok: false, reason: "precision" });
  });

  it("rejects negatives", () => {
    expect(parseAmountInput("-5")).toEqual({ ok: false, reason: "negative" });
    expect(parseAmountInput("−5.00")).toEqual({ ok: false, reason: "negative" });
    expect(parseAmountInput("$-5")).toEqual({ ok: false, reason: "negative" });
    expect(parseAmountInput("(5.00)")).toEqual({ ok: false, reason: "negative" });
  });

  it("rejects zero in every spelling", () => {
    for (const z of ["0", "0.00", "0.0", "$0", "000", "0."]) expect(parseAmountInput(z)).toEqual({ ok: false, reason: "zero" });
  });

  it("rejects too many integer digits and empty", () => {
    expect(parseAmountInput("12345678901")).toEqual({ ok: false, reason: "too_large" });
    expect(parseAmountInput("")).toEqual({ ok: false, reason: "empty" });
  });

  it("tolerates non-string input without throwing", () => {
    expect(parseAmountToCents(undefined as unknown as string)).toBeNull();
    expect(parseAmountToCents(null as unknown as string)).toBeNull();
  });
});

describe("formatting", () => {
  it("formatCents", () => {
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(5)).toBe("$0.05");
    expect(formatCents(100)).toBe("$1.00");
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(261990009)).toBe("$2,619,900.09");
    expect(formatCents(-123456)).toBe("−$1,234.56");
    expect(formatCents(-1)).toBe("−$0.01");
  });
  it("formatSignedCents", () => {
    expect(formatSignedCents(150)).toBe("+$1.50");
    expect(formatSignedCents(-150)).toBe("−$1.50");
    expect(formatSignedCents(0)).toBe("$0.00");
  });
  it("whole dollars round half up", () => {
    expect(formatWholeDollars(149)).toBe("$1");
    expect(formatWholeDollars(150)).toBe("$2");
    expect(formatWholeDollars(-150)).toBe("−$2");
    expect(formatWholeDollars(123456789)).toBe("$1,234,568");
  });
  it("compact", () => {
    expect(formatCompactCents(95000)).toBe("$950");
    expect(formatCompactCents(1250000)).toBe("$13K");
    expect(formatCompactCents(262000000)).toBe("$2.62M");
    expect(formatCompactCents(100000000)).toBe("$1M");
    expect(formatCompactCents(-1250000)).toBe("−$13K");
  });
  it("round-trips through input value", () => {
    for (const c of [1, 99, 100, 125000, 123456789]) expect(parseAmountToCents(centsToInputValue(c))).toBe(c);
    expect(centsToInputValue(125000)).toBe("1,250.00");
  });
});

describe("sums", () => {
  it("sums integers exactly", () => {
    expect(sumCents([])).toBe(0);
    expect(sumCents([10, 20, -5])).toBe(25);
    expect(sumBy([{ a: 1 }, { a: 2 }], (x) => x.a)).toBe(3);
  });
});
