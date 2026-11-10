import type { Page } from "@playwright/test";

/**
 * Waits for finite CSS animations/transitions to end (entrance motion shifts bounding boxes mid-flight).
 * Animations frozen by scroll reveal (blocks still below the fold, data-reveal="pending") never finish on their own,
 * so they are skipped: use revealAll() first when a test needs the whole page settled.
 */
export async function animationsDone(page: Page) {
  // Polled rather than awaiting `finished`: a running animation can be frozen mid-way (hydration marking its block as
  // below the fold), and its `finished` promise would then never settle.
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.effect?.getComputedTiming().iterations === Infinity || a.playState !== "running"),
    undefined,
    { polling: "raf" },
  );
}

/** Scrolls the whole page top to bottom (so every scroll-revealed block runs), returns to the top and waits for motion to end. */
export async function revealAll(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight / 2));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => document.querySelectorAll('[data-reveal="pending"]').length === 0);
  await animationsDone(page);
}
