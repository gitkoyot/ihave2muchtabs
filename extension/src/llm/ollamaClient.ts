import type { AskAnswerResult, OllamaSettings, SummaryResult } from "../types/models";
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
