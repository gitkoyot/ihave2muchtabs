export interface ExtractedContent {
  pageTitle: string;
  text: string;
  links: string[];
}

export function extractMainTextFromHtml(html: string, fallbackUrl: string): ExtractedContent {
  // Service workers do not have DOMParser. Use a lightweight HTML-to-text fallback for MVP.
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = decodeHtmlEntities((titleMatch?.[1] ?? "").trim()) || fallbackUrl;

  const bodyOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const text = decodeHtmlEntities(bodyOnly.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  const links = extractLinks(html, fallbackUrl);
  return { pageTitle, text, links };
}

function decodeHtmlEntities(input: string): string {
  return input
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function extractLinks(html: string, baseUrl: string): string[] {
  const matches = html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi);
  const seen = new Set<string>();
  const results: string[] = [];

  for (const match of matches) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    if (raw.startsWith("#") || raw.startsWith("javascript:") || raw.startsWith("mailto:")) continue;
    try {
      const absolute = new URL(raw, baseUrl).toString();
      if (!absolute.startsWith("http://") && !absolute.startsWith("https://")) continue;
      if (seen.has(absolute)) continue;
      seen.add(absolute);
      results.push(absolute);
      if (results.length >= 200) break;
    } catch {
      continue;
    }
  }

  return results;
}
