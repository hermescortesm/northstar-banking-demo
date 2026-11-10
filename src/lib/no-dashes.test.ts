// @vitest-environment node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Built from char codes so this file contains no dash characters or escape text itself.
const EN = String.fromCharCode(0x2013);
const EM = String.fromCharCode(0x2014);
const BAD = new RegExp(`[${EN}${EM}]|&[mn]dash;|\\\\u201[34]|\\\\u\\{201[34]\\}`, "i");

describe("no em or en dashes in tracked files", () => {
  it("has none in the repo", () => {
    const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
      .split("\n")
      .filter((f) => f && existsSync(f) && /\.(tsx?|mts|mjs|css|md|ya?ml|json)$/.test(f) && f !== "package-lock.json");
    const hits = files.filter((f) => BAD.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
});
