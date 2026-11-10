import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./Reveal";

class FakeIO {
  static all: FakeIO[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public cb: IntersectionObserverCallback, public options?: IntersectionObserverInit) {
    FakeIO.all.push(this);
  }
  observe(el: Element) { this.observed.push(el); }
  disconnect() { this.disconnected = true; }
  fire(isIntersecting: boolean) {
    this.cb([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

/** jsdom has no layout: place the element `top` px from the top of an 800px viewport. */
function at(top: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top, bottom: top + 100, height: 100 } as DOMRect);
}

function reducedMotion(on: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
}

beforeEach(() => {
  FakeIO.all = [];
  vi.stubGlobal("IntersectionObserver", FakeIO);
  vi.stubGlobal("innerHeight", 800);
  reducedMotion(false);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const el = () => screen.getByTestId("r");

describe("Reveal / useReveal", () => {
  it("leaves content that is already on screen alone and observes nothing", () => {
    at(200);
    render(<Reveal data-testid="r">x</Reveal>);
    expect(el().getAttribute("data-reveal")).toBe("in");
    expect(FakeIO.all).toHaveLength(0);
  });

  it("holds an element below the fold, reveals it once when it intersects, then stops observing", () => {
    at(1200);
    render(<Reveal data-testid="r">x</Reveal>);
    expect(el().getAttribute("data-reveal")).toBe("pending");
    expect(el().textContent).toBe("x"); // held visually by CSS only, never removed from the DOM
    const [io] = FakeIO.all;
    expect(io.observed).toEqual([el()]);
    expect(io.options?.rootMargin).toBe("0px 0px -10% 0px");
    act(() => io.fire(false));
    expect(el().getAttribute("data-reveal")).toBe("pending");
    act(() => io.fire(true));
    expect(el().getAttribute("data-reveal")).toBe("seen");
    expect(io.disconnected).toBe(true);
  });

  it("reveals when the element or a descendant gets keyboard focus", () => {
    at(1200);
    render(<Reveal data-testid="r"><button>b</button></Reveal>);
    expect(el().getAttribute("data-reveal")).toBe("pending");
    act(() => { fireEvent.focusIn(screen.getByRole("button")); });
    expect(el().getAttribute("data-reveal")).toBe("seen");
    expect(FakeIO.all[0].disconnected).toBe(true);
  });

  it("treats the bottom 10% of the viewport as not reached yet", () => {
    at(730); // 800 * 0.9 = 720
    render(<Reveal data-testid="r">x</Reveal>);
    expect(el().getAttribute("data-reveal")).toBe("pending");
  });

  it("never holds content without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    at(1200);
    render(<Reveal data-testid="r">x</Reveal>);
    expect(el().getAttribute("data-reveal")).toBe("in");
  });

  it("never holds content for reduced motion", () => {
    reducedMotion(true);
    at(1200);
    render(<Reveal data-testid="r">x</Reveal>);
    expect(el().getAttribute("data-reveal")).toBe("in");
    expect(FakeIO.all).toHaveLength(0);
  });

  it("disconnects the observer on unmount", () => {
    at(1200);
    const { unmount } = render(<Reveal data-testid="r">x</Reveal>);
    const [io] = FakeIO.all;
    unmount();
    expect(io.disconnected).toBe(true);
  });

  it("renders any tag via `as`", () => {
    at(100);
    render(<Reveal as="section" data-testid="r">x</Reveal>);
    expect(el().tagName).toBe("SECTION");
  });
});
