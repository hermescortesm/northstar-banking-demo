import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OverviewSkeleton } from "./OverviewSkeleton";
import { TransactionsSkeleton } from "./TransactionsSkeleton";
import { TransfersSkeleton } from "./TransfersSkeleton";

afterEach(cleanup);

describe.each([
  ["Overview", <OverviewSkeleton key="o" />, "Loading overview"],
  ["Transactions", <TransactionsSkeleton key="t" />, "Loading transactions"],
  ["Transfers", <TransfersSkeleton key="x" />, "Loading transfers"],
])("%s skeleton", (_name, ui, text) => {
  it("is a busy status region with an sr-only label and hidden placeholders", () => {
    const { container } = render(ui);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-busy")).toBe("true");
        expect(container.querySelectorAll(".sk").length).toBeGreaterThan(5);
    expect(container.querySelector("[aria-hidden='true'].contents")).not.toBeNull();
    // placeholders carry no readable text
    expect(region.textContent).toBe(text);
  });
});

it("renders 12 desktop/mobile rows by default in the transactions table", () => {
  const { container } = render(<TransactionsSkeleton />);
  expect(container.querySelectorAll("section > div.min-h-\\[62px\\]").length).toBe(12);
});
