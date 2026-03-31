import { describe, expect, it, vi } from "vitest";
import { fetchPage } from "../src/fetcher/pageFetcher";

describe("fetchPage", () => {
  it("passes redirect and abort signal to fetch and returns response fields", async () => {
    const text = vi.fn().mockResolvedValue("<html>ok</html>");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      url: "https://example.com/final",
      status: 200,
      text
    } as Response);

    const result = await fetchPage("https://example.com/start", 5000);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/start",
      expect.objectContaining({
        redirect: "follow",
        signal: expect.any(AbortSignal)
      })
    );
    expect(result).toEqual({
      finalUrl: "https://example.com/final",
      httpStatus: 200,
      ok: true,
      html: "<html>ok</html>"
    });
  });

  it("falls back to the original URL when response.url is empty", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      url: "",
      status: 200,
      text: vi.fn().mockResolvedValue("body")
    } as Partial<Response>);

    const result = await fetchPage("https://example.com/original");

    expect(result.finalUrl).toBe("https://example.com/original");
  });

  it("returns non-2xx responses without transforming them", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      url: "https://example.com/forbidden",
      status: 403,
      text: vi.fn().mockResolvedValue("forbidden")
    } as Partial<Response>);

    const result = await fetchPage("https://example.com/test");

    expect(result).toEqual({
      finalUrl: "https://example.com/forbidden",
      httpStatus: 403,
      ok: false,
      html: "forbidden"
    });
  });

  it("propagates fetch rejections to the caller", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    await expect(fetchPage("https://example.com/test")).rejects.toThrow("Network error");
  });

  it("propagates abort errors raised by fetch", async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException("The operation was aborted", "AbortError"));
    await expect(fetchPage("https://example.com/test", 1)).rejects.toThrow("The operation was aborted");
  });

  it("returns raw response values even when optional fields are missing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      text: vi.fn().mockResolvedValue("")
    });

    const result = await fetchPage("https://example.com/test");

    expect(result).toEqual({
      finalUrl: "https://example.com/test",
      httpStatus: undefined,
      ok: undefined,
      html: ""
    });
  });
});
