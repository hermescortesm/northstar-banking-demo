import { describe, expect, it } from "vitest";
import { daysInMonth, formatClock, formatDayLong, formatDayShort, fromDayNumber, toDayNumber, toIso } from "./dates";

describe("dates", () => {
  it("epoch and known weekdays", () => {
    expect(toDayNumber("1970-01-01")).toBe(0);
    expect(fromDayNumber(0).weekday).toBe(4);
    expect(fromDayNumber(toDayNumber("2026-11-09")).weekday).toBe(1);
    expect(formatDayLong(toDayNumber("2026-11-09"))).toBe("Monday, November 9, 2026");
  });
  it("round trips every day across leap years", () => {
    for (let n = toDayNumber("2023-12-25"); n <= toDayNumber("2028-03-05"); n++) expect(toDayNumber(toIso(n))).toBe(n);
  });
  it("month lengths", () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
  it("formats", () => {
    expect(formatDayShort(toDayNumber("2026-03-02"))).toBe("Mar 2");
    expect(formatClock(0, 5)).toBe("12:05 AM");
    expect(formatClock(15, 4)).toBe("3:04 PM");
  });
});
