export interface ExtractedContent {
  pageTitle: string;
  text: string;
}

export function extractMainTextFromHtml(html: string, fallbackUrl: string): ExtractedContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const pageTitle = doc.title || fallbackUrl;
  const text = (doc.body?.innerText ?? "").replace(/\s+/g, " ").trim();
  return { pageTitle, text };
}

