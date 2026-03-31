import type { AskAnswerResult, OllamaSettings, SummaryResult } from "../types/models";
import { api } from "../utils/browser-api";
import {
  ANSWER_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildAnswerUserPrompt,
  buildSummaryUserPrompt
} from "./prompts";
import { parseAskAnswerResultJson, parseSummaryResultJson } from "./validators";

interface OllamaChatResponse {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaEmbeddingsResponse {
  embeddings?: number[][];
}

interface OllamaTagsResponse {
  models?: Array<{ name: string }>;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

function chatUrl(settings: OllamaSettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/api/chat`;
}

function embeddingsUrl(settings: OllamaSettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/api/embed`;
}

function extractJson(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Ollama response");
  }
  return jsonMatch[0];
}

async function fetchAvailableModels(endpoint: string): Promise<string> {
  try {
    const res = await fetch(`${normalizeEndpoint(endpoint)}/api/tags`);
    if (!res.ok) return "(failed to fetch model list)";
    const data = (await res.json()) as OllamaTagsResponse;
    const names = data.models?.map((m) => m.name) ?? [];
    return names.length > 0 ? names.join(", ") : "(no installed models found)";
  } catch {
    return "(failed to fetch model list)";
  }
}

async function ollama404Error(endpoint: string, requestedModel: string): Promise<Error> {
  const available = await fetchAvailableModels(endpoint);
  return new Error(
    `Model "${requestedModel}" was not found in Ollama.\n` +
    `Available models: ${available}\n` +
    `Install it with: ollama pull ${requestedModel}`
  );
}

function getExtensionOriginPattern(): string {
  const extensionUrl = api.runtime.getURL("");
  if (extensionUrl.startsWith("moz-extension://")) {
    return "moz-extension://*";
  }
  return "chrome-extension://*";
}

function ollamaForbiddenError(): Error {
  const originPattern = getExtensionOriginPattern();
  return new Error(
    "403 Forbidden - Ollama is blocking requests from this extension.\n" +
    `Allow the current browser extension origin and restart Ollama:\n` +
    `$env:OLLAMA_ORIGINS="${originPattern}"; ollama serve`
  );
}

export async function listModels(settings: OllamaSettings): Promise<string[]> {
  const res = await fetch(`${normalizeEndpoint(settings.endpoint)}/api/tags`);
  if (res.status === 403) throw ollamaForbiddenError();
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama /api/tags failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as OllamaTagsResponse;
  return data.models?.map((m) => m.name) ?? [];
}

export async function checkChat(settings: OllamaSettings): Promise<void> {
  const response = await fetch(chatUrl(settings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.chatModel,
      messages: [{ role: "user", content: "Hi" }],
      stream: false,
      options: { num_predict: 1 }
    })
  });
  if (response.status === 403) throw ollamaForbiddenError();
  if (response.status === 404) throw await ollama404Error(settings.endpoint, settings.chatModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama chat check failed: ${response.status} ${errorText}`);
  }
}

export async function generateSummary(
  settings: OllamaSettings,
  input: { bookmarkTitle: string; url: string; pageTitle: string; contentText: string }
): Promise<{ result: SummaryResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await fetch(chatUrl(settings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.chatModel,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT + " Return strict JSON only." },
        { role: "user", content: buildSummaryUserPrompt(input) }
      ],
      stream: false,
      format: "json"
    })
  });

  if (response.status === 403) throw ollamaForbiddenError();
  if (response.status === 404) throw await ollama404Error(settings.endpoint, settings.chatModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama chat summary failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OllamaChatResponse;
  const content = data.message?.content;
  if (!content) {
    throw new Error("Ollama chat summary missing content");
  }

  return {
    result: parseSummaryResultJson(extractJson(content)),
    tokenUsageIn: data.prompt_eval_count ?? null,
    tokenUsageOut: data.eval_count ?? null
  };
}

export async function generateEmbedding(settings: OllamaSettings, input: string): Promise<number[]> {
  const response = await fetch(embeddingsUrl(settings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input
    })
  });

  if (response.status === 403) throw ollamaForbiddenError();
  if (response.status === 404) throw await ollama404Error(settings.endpoint, settings.embeddingModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama embeddings failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OllamaEmbeddingsResponse;
  const embedding = data.embeddings?.[0];
  if (!embedding) {
    throw new Error("Ollama embeddings response missing vector");
  }
  return embedding;
}

export async function answerQuery(
  settings: OllamaSettings,
  question: string,
  retrievedRecordsJson: string
): Promise<{ result: AskAnswerResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await fetch(chatUrl(settings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.chatModel,
      messages: [
        { role: "system", content: ANSWER_SYSTEM_PROMPT + " Return strict JSON only." },
        { role: "user", content: buildAnswerUserPrompt(question, retrievedRecordsJson) }
      ],
      stream: false,
      format: "json"
    })
  });

  if (response.status === 403) throw ollamaForbiddenError();
  if (response.status === 404) throw await ollama404Error(settings.endpoint, settings.chatModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama answer failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OllamaChatResponse;
  const content = data.message?.content;
  if (!content) {
    throw new Error("Ollama answer missing content");
  }

  return {
    result: parseAskAnswerResultJson(extractJson(content)),
    tokenUsageIn: data.prompt_eval_count ?? null,
    tokenUsageOut: data.eval_count ?? null
  };
}
