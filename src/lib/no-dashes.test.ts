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
      .filter((f) => f && existsSync(f) && f !== "package-lock.json");
    // every text file (txt, svg, html, json, css, md, yml, source ...); binaries are skipped by their NUL bytes
    const hits = files.filter((f) => {
      const buf = readFileSync(f);
      return !buf.includes(0) && BAD.test(buf.toString("utf8"));
    });
    expect(hits).toEqual([]);
  });
});
