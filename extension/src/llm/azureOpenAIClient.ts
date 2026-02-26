import type { AskAnswerResult, AzureOpenAISettings, SummaryResult } from "../types/models";
import {
  ANSWER_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildAnswerUserPrompt,
  buildSummaryUserPrompt
} from "./prompts";
import { parseAskAnswerResultJson, parseSummaryResultJson } from "./validators";

interface AzureChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

interface AzureEmbeddingsResponse {
  data?: Array<{ embedding?: number[] }>;
}

function headers(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "api-key": apiKey
  };
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

function chatUrl(settings: AzureOpenAISettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/openai/deployments/${settings.chatDeployment}/chat/completions?api-version=${encodeURIComponent(settings.apiVersion)}`;
}

function embeddingsUrl(settings: AzureOpenAISettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/openai/deployments/${settings.embeddingDeployment}/embeddings?api-version=${encodeURIComponent(settings.apiVersion)}`;
}

export async function generateSummary(
  settings: AzureOpenAISettings,
  input: { bookmarkTitle: string; url: string; pageTitle: string; contentText: string }
): Promise<{ result: SummaryResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await fetch(chatUrl(settings), {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: buildSummaryUserPrompt(input) }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Azure chat summary failed: ${response.status}`);
  }

  const data = (await response.json()) as AzureChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Azure chat summary missing content");
  }

  return {
    result: parseSummaryResultJson(content),
    tokenUsageIn: data.usage?.prompt_tokens ?? null,
    tokenUsageOut: data.usage?.completion_tokens ?? null
  };
}

export async function generateEmbedding(settings: AzureOpenAISettings, input: string): Promise<number[]> {
  const response = await fetch(embeddingsUrl(settings), {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({ input })
  });

  if (!response.ok) {
    throw new Error(`Azure embeddings failed: ${response.status}`);
  }

  const data = (await response.json()) as AzureEmbeddingsResponse;
  const embedding = data.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Azure embeddings response missing vector");
  }
  return embedding;
}

export async function answerQuery(
  settings: AzureOpenAISettings,
  question: string,
  retrievedRecordsJson: string
): Promise<{ result: AskAnswerResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await fetch(chatUrl(settings), {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({
      messages: [
        { role: "system", content: ANSWER_SYSTEM_PROMPT },
        { role: "user", content: buildAnswerUserPrompt(question, retrievedRecordsJson) }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Azure answer failed: ${response.status}`);
  }

  const data = (await response.json()) as AzureChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Azure answer missing content");
  }
  return {
    result: parseAskAnswerResultJson(content),
    tokenUsageIn: data.usage?.prompt_tokens ?? null,
    tokenUsageOut: data.usage?.completion_tokens ?? null
  };
}
