import { describe, expect, it } from "vitest";
import { sha256Hex } from "../src/utils/hash";

describe("sha256Hex", () => {
  it("returns the known SHA-256 digest for an empty string", async () => {
    await expect(sha256Hex("")).resolves.toBe(
      "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("returns the known SHA-256 digest for a simple string", async () => {
    await expect(sha256Hex("hello")).resolves.toBe(
      "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });

  it("is deterministic for repeated input", async () => {
    const [first, second] = await Promise.all([sha256Hex("test"), sha256Hex("test")]);
    expect(first).toBe(second);
  });

  it("changes when the input changes", async () => {
    const [first, second] = await Promise.all([sha256Hex("Test"), sha256Hex("test")]);
    expect(first).not.toBe(second);
  });

  it("returns a prefixed 64-character lowercase hex digest", async () => {
    const hash = await sha256Hex("abc");
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(hash).toHaveLength(71);
  });

  it("handles unicode and long input", async () => {
    const unicode = await sha256Hex("Hello 世界 🌍");
    const longInput = await sha256Hex("a".repeat(10_000));
    expect(unicode).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(longInput).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(unicode).not.toBe(longInput);
  });
});
