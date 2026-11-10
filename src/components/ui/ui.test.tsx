import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Drawer } from "./Drawer";
import { Field } from "./Field";
import { Input } from "./Input";
import { Money } from "./Money";
import { SegmentedControl } from "./SegmentedControl";
import { StatusPill } from "./Badge";

afterEach(cleanup);

describe("Button", () => {
  it("defaults to type=button and the secondary look", () => {
    render(<Button>Save</Button>);
    const b = screen.getByRole("button", { name: "Save" });
    expect(b.getAttribute("type")).toBe("button");
    expect(b.className).toContain("bg-surface");
  });

  it("renders each variant with its own colours", () => {
    render(
      <>
        <Button variant="primary">p</Button>
        <Button variant="accent">a</Button>
        <Button variant="ghost">g</Button>
        <Button variant="danger">d</Button>
      </>,
    );
    expect(screen.getByText("p").className).toContain("bg-text");
    expect(screen.getByText("a").className).toContain("bg-accent-fill");
    expect(screen.getByText("g").className).toContain("bg-transparent");
    expect(screen.getByText("d").className).toContain("text-neg");
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading disables the button, sets aria-busy and shows a spinner", () => {
    const onClick = vi.fn();
    const { container } = render(<Button loading onClick={onClick}>Saving</Button>);
    const b = screen.getByRole("button", { name: "Saving" });
    expect((b as HTMLButtonElement).disabled).toBe(true);
    expect(b.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Field", () => {
  function Demo({ error, hint }: { error?: string; hint?: string }) {
    return (
      <Field id="amt" label="Amount" error={error} hint={hint}>
        {(p) => <Input {...p} defaultValue="" />}
      </Field>
    );
  }

  it("links label, hint and error to the input", () => {
    render(<Demo error="Too big" hint="Max 10" />);
    const input = screen.getByLabelText("Amount");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("amt-err amt-hint");
    expect(document.getElementById("amt-err")?.textContent).toBe("Too big");
    expect(document.getElementById("amt-hint")?.textContent).toBe("Max 10");
  });

  it("is valid and undescribed without error or hint", () => {
    render(<Demo />);
    const input = screen.getByLabelText("Amount");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });
});

describe("SegmentedControl", () => {
  function Demo() {
    const [v, setV] = useState("30D");
    return <SegmentedControl label="Range" options={["7D", "30D", "90D"]} value={v} onChange={setV} />;
  }

  it("is a labelled group with exactly one pressed button", () => {
    render(<Demo />);
    expect(screen.getByRole("group", { name: "Range" })).toBeTruthy();
    const pressed = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed.map((b) => b.textContent)).toEqual(["30D"]);
  });

  it("moves the pressed state on click and the buttons are native (keyboard operable)", () => {
    render(<Demo />);
    const b = screen.getByRole("button", { name: "90D" });
    expect(b.tagName).toBe("BUTTON");
    fireEvent.click(b);
    expect(b.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "30D" }).getAttribute("aria-pressed")).toBe("false");
  });
});

describe("Money", () => {
  it("formats cents with tabular numerals", () => {
    const { container } = render(<Money cents={123456} />);
    expect(container.textContent).toBe("$1,234.56");
    expect(container.firstElementChild?.className).toContain("num");
  });

  it("shows a sign and colours incoming money", () => {
    const { container } = render(<><Money cents={500} signed tone /><Money cents={-500} signed tone /></>);
    const [pos, neg] = Array.from(container.children) as HTMLElement[];
    expect(pos.textContent).toMatch(/^\+\$5\.00$/);
    expect(pos.className).toContain("text-pos");
    expect(neg.textContent).toMatch(/\$5\.00$/);
    expect(neg.textContent).not.toBe(pos.textContent);
    expect(neg.className).not.toContain("text-pos");
  });
});

describe("StatusPill", () => {
  it("labels each status", () => {
    render(<><StatusPill status="completed" /><StatusPill status="pending" /><StatusPill status="failed" /></>);
    expect(["Completed", "Pending", "Failed"].every((t) => screen.getByText(t))).toBe(true);
  });
});

describe("Drawer", () => {
  function Demo({ onClose }: { onClose: () => void }) {
    const ref = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button>outside</button>
        <Drawer labelledBy="t" closeLabel="Close it" onClose={onClose} initialFocus={ref}>
          <h2 id="t">Title</h2>
          <button ref={ref}>first</button>
          <button>last</button>
        </Drawer>
      </>
    );
  }

  it("is a modal dialog that focuses the requested element and makes the page inert", () => {
    render(<Demo onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "Title" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement?.textContent).toBe("first");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes on Escape, traps Tab and restores the page on unmount", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Demo onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    // jsdom has no layout, so offsetParent is always null: give the buttons one for the trap filter
    for (const b of Array.from(document.querySelectorAll("aside button"))) {
      Object.defineProperty(b, "offsetParent", { configurable: true, get: () => document.body });
    }
    const last = screen.getByText("last");
    act(() => last.focus());
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement?.textContent).toBe("first");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
