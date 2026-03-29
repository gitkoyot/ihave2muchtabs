import type { AskAnswerResult, CopilotSettings, SummaryResult } from "../types/models";
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

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

function headers(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };
}

function chatUrl(settings: CopilotSettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/chat/completions`;
}

function embeddingsUrl(settings: CopilotSettings): string {
  return `${normalizeEndpoint(settings.endpoint)}/embeddings`;
}

export async function generateSummary(
  settings: CopilotSettings,
  input: { bookmarkTitle: string; url: string; pageTitle: string; contentText: string }
): Promise<{ result: SummaryResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await fetch(chatUrl(settings), {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({
      model: settings.chatModel,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: buildSummaryUserPrompt(input) }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Copilot chat summary failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Copilot chat summary missing content");
  }

  return {
    result: parseSummaryResultJson(content),
    tokenUsageIn: data.usage?.prompt_tokens ?? null,
    tokenUsageOut: data.usage?.completion_tokens ?? null
  };
}

export async function generateEmbedding(settings: CopilotSettings, input: string): Promise<number[]> {
  const response = await fetch(embeddingsUrl(settings), {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({
      model: settings.embeddingModel,
      input
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Copilot embeddings failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingsResponse;
  const embedding = data.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Copilot embeddings response missing vector");
  }
  return embedding;
}

export async function answerQuery(
  settings: CopilotSettings,
  question: string,
  retrievedRecordsJson: string
): Promise<{ result: AskAnswerResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await fetch(chatUrl(settings), {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({
      model: settings.chatModel,
      messages: [
        { role: "system", content: ANSWER_SYSTEM_PROMPT },
        { role: "user", content: buildAnswerUserPrompt(question, retrievedRecordsJson) }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Copilot answer failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Copilot answer missing content");
  }

  return {
    result: parseAskAnswerResultJson(content),
    tokenUsageIn: data.usage?.prompt_tokens ?? null,
    tokenUsageOut: data.usage?.completion_tokens ?? null
  };
}
