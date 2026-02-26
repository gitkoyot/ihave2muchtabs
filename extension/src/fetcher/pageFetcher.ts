export interface FetchPageResult {
  finalUrl: string;
  httpStatus: number | null;
  ok: boolean;
  html: string;
}

export async function fetchPage(url: string, timeoutMs = 15000): Promise<FetchPageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow"
    });

    return {
      finalUrl: response.url || url,
      httpStatus: response.status,
      ok: response.ok,
      html: await response.text()
    };
  } finally {
    clearTimeout(timeout);
  }
}

