import type { Page } from "@playwright/test";

/** Waits for finite CSS animations/transitions to end (entrance motion shifts bounding boxes mid-flight). */
export async function animationsDone(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}
