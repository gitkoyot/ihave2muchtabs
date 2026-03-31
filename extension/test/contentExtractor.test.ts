import { describe, expect, it } from "vitest";
import { extractMainTextFromHtml } from "../src/extractor/contentExtractor";

describe("extractMainTextFromHtml", () => {
  it("uses the decoded title when present", () => {
    const result = extractMainTextFromHtml(
      "<html><head><title>My &amp; Page</title></head><body>Body</body></html>",
      "https://fallback.test"
    );

    expect(result.pageTitle).toBe("My & Page");
  });

  it("falls back to the URL when the title is missing or blank", () => {
    expect(extractMainTextFromHtml("<html><body>Body</body></html>", "https://fallback.test").pageTitle)
      .toBe("https://fallback.test");
    expect(extractMainTextFromHtml("<title>   </title>", "https://fallback.test").pageTitle)
      .toBe("https://fallback.test");
  });

  it("removes script, style and noscript content from extracted text", () => {
    const html = `
      <html>
        <head><title>Article</title></head>
        <body>
          <h1>Main heading</h1>
          <script>window.bad = true;</script>
          <style>.hidden { display:none; }</style>
          <noscript>Fallback</noscript>
          <p>Visible text</p>
        </body>
      </html>
    `;

    const result = extractMainTextFromHtml(html, "https://example.com");

    expect(result.text).toContain("Main heading");
    expect(result.text).toContain("Visible text");
    expect(result.text).not.toContain("window.bad");
    expect(result.text).not.toContain("display:none");
    expect(result.text).not.toContain("Fallback");
  });

  it("keeps title text if malformed markup leaves it in the body string", () => {
    const result = extractMainTextFromHtml("<html><head><title>Test</title><body>Content", "https://fallback.test");
    expect(result.pageTitle).toBe("Test");
    expect(result.text).toBe("Test Content");
  });

  it("extracts absolute links, resolves relative links and skips unsupported ones", () => {
    const html = `
      <a href="/page">Local</a>
      <a href="https://external.com/path">External</a>
      <a href="#section">Anchor</a>
      <a href="javascript:void(0)">JS</a>
      <a href="mailto:test@example.com">Mail</a>
      <a href="/page">Duplicate</a>
    `;

    const result = extractMainTextFromHtml(html, "https://example.com/base");

    expect(result.links).toEqual([
      "https://example.com/page",
      "https://external.com/path"
    ]);
  });

  it("caps extracted links at 200 unique items", () => {
    const html = Array.from({ length: 250 }, (_, index) => `<a href="/item-${index}">item</a>`).join("");
    const result = extractMainTextFromHtml(html, "https://example.com");
    expect(result.links).toHaveLength(200);
    expect(result.links[0]).toBe("https://example.com/item-0");
    expect(result.links[199]).toBe("https://example.com/item-199");
  });

  it("handles empty input", () => {
    expect(extractMainTextFromHtml("", "https://fallback.test")).toEqual({
      pageTitle: "https://fallback.test",
      text: "",
      links: []
    });
  });
});
