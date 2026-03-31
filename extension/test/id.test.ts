import { describe, expect, it, vi } from "vitest";
import { makeId } from "../src/utils/id";

describe("makeId", () => {
  it("builds an id from prefix, timestamp and random suffix", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    expect(makeId("rec")).toBe("rec_1700000000000_4fzzzxjy");
  });

  it("preserves the provided prefix", () => {
    const id = makeId("job");
    expect(id.startsWith("job_")).toBe(true);
  });
});
