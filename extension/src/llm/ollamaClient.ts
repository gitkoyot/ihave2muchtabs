// Generic local-model client using the OpenAI-compatible API surface
// (/v1/chat/completions, /v1/embeddings, /v1/models).
// Works with any local server that speaks the OpenAI protocol, including
// Ollama (via its /v1 compatibility layer) and LM Studio.
import type { AskAnswerResult, LocalModelSettings, SummaryResult } from "../types/models";
import { api } from "../utils/browser-api";
import {
  ANSWER_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildAnswerUserPrompt,
  buildSummaryUserPrompt
} from "./prompts";
import { parseAskAnswerResultJson, parseSummaryResultJson } from "./validators";

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

interface OpenAIEmbeddingsResponse {
  data?: Array<{ embedding?: number[] }>;
}

interface OpenAIModelsResponse {
  data?: Array<{ id: string }>;
}

function normalizeEndpoint(endpoint: string): string {
  // Strip trailing slashes and a trailing /v1 so we can append it consistently.
  return endpoint.replace(/\/+$/, "").replace(/\/v1$/, "");
}

function chatUrl(settings: LocalModelSettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/v1/chat/completions`;
}

function embeddingsUrl(settings: LocalModelSettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/v1/embeddings`;
}

function modelsUrl(endpoint: string): string {
  return `${normalizeEndpoint(endpoint)}/v1/models`;
}

function extractJson(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in local model response");
  }
  return jsonMatch[0];
}

function getExtensionOriginPattern(): string {
  const extensionUrl = api.runtime.getURL("");
  if (extensionUrl.startsWith("moz-extension://")) {
    return "moz-extension://*";
  }
  return "chrome-extension://*";
}

function forbiddenError(): Error {
  const originPattern = getExtensionOriginPattern();
  return new Error(
    "403 Forbidden - the local model server is blocking requests from this extension (CORS).\n" +
    "For Ollama, allow the extension origin and restart it:\n" +
    `  $env:OLLAMA_ORIGINS="${originPattern}"; ollama serve\n` +
    "For LM Studio, enable CORS in the Developer / Local Server settings."
  );
}

async function fetchAvailableModels(endpoint: string): Promise<string> {
  try {
    const res = await fetch(modelsUrl(endpoint));
    if (!res.ok) return "(failed to fetch model list)";
    const data = (await res.json()) as OpenAIModelsResponse;
    const names = data.data?.map((m) => m.id) ?? [];
    return names.length > 0 ? names.join(", ") : "(no models loaded)";
  } catch {
    return "(failed to fetch model list)";
  }
}

async function modelNotFoundError(endpoint: string, requestedModel: string): Promise<Error> {
  const available = await fetchAvailableModels(endpoint);
  return new Error(
    `Model "${requestedModel}" was not found on the local server.\n` +
    `Available models: ${available}\n` +
    `For Ollama: ollama pull ${requestedModel}. For LM Studio: load the model in the app.`
  );
}

async function postChat(
  settings: LocalModelSettings,
  messages: Array<{ role: string; content: string }>,
  opts?: { jsonMode?: boolean; maxTokens?: number }
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: settings.chatModel,
    messages,
    stream: false,
    temperature: 0
  };
  if (opts?.jsonMode) body.response_format = { type: "json_object" };
  if (typeof opts?.maxTokens === "number") body.max_tokens = opts.maxTokens;

  return await fetch(chatUrl(settings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function listModels(settings: LocalModelSettings): Promise<string[]> {
  const res = await fetch(modelsUrl(settings.endpoint));
  if (res.status === 403) throw forbiddenError();
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Local model /v1/models failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as OpenAIModelsResponse;
  return data.data?.map((m) => m.id) ?? [];
}

export async function checkChat(settings: LocalModelSettings): Promise<void> {
  const response = await postChat(settings, [{ role: "user", content: "Hi" }], { maxTokens: 1 });
  if (response.status === 403) throw forbiddenError();
  if (response.status === 404) throw await modelNotFoundError(settings.endpoint, settings.chatModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Local model chat check failed: ${response.status} ${errorText}`);
  }
}

export async function generateSummary(
  settings: LocalModelSettings,
  input: { bookmarkTitle: string; url: string; pageTitle: string; contentText: string }
): Promise<{ result: SummaryResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await postChat(settings, [
    { role: "system", content: SUMMARY_SYSTEM_PROMPT + " Return strict JSON only." },
    { role: "user", content: buildSummaryUserPrompt(input) }
  ], { jsonMode: true });

  if (response.status === 403) throw forbiddenError();
  if (response.status === 404) throw await modelNotFoundError(settings.endpoint, settings.chatModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Local model chat summary failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Local model chat summary missing content");
  }

  return {
    result: parseSummaryResultJson(extractJson(content)),
    tokenUsageIn: data.usage?.prompt_tokens ?? null,
    tokenUsageOut: data.usage?.completion_tokens ?? null
  };
}

export async function generateEmbedding(settings: LocalModelSettings, input: string): Promise<number[]> {
  const response = await fetch(embeddingsUrl(settings), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input
    })
  });

  if (response.status === 403) throw forbiddenError();
  if (response.status === 404) throw await modelNotFoundError(settings.endpoint, settings.embeddingModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Local model embeddings failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingsResponse;
  const embedding = data.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Local model embeddings response missing vector");
  }
  return embedding;
}

export async function answerQuery(
  settings: LocalModelSettings,
  question: string,
  retrievedRecordsJson: string
): Promise<{ result: AskAnswerResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await postChat(settings, [
    { role: "system", content: ANSWER_SYSTEM_PROMPT + " Return strict JSON only." },
    { role: "user", content: buildAnswerUserPrompt(question, retrievedRecordsJson) }
  ], { jsonMode: true });

  if (response.status === 403) throw forbiddenError();
  if (response.status === 404) throw await modelNotFoundError(settings.endpoint, settings.chatModel);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Local model answer failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Local model answer missing content");
  }

  return {
    result: parseAskAnswerResultJson(extractJson(content)),
    tokenUsageIn: data.usage?.prompt_tokens ?? null,
    tokenUsageOut: data.usage?.completion_tokens ?? null
  };
}
