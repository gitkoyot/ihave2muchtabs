import type { AnthropicSettings, AskAnswerResult, SummaryResult } from "../types/models";
import {
  ANSWER_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildAnswerUserPrompt,
  buildSummaryUserPrompt
} from "./prompts";
import { parseAskAnswerResultJson, parseSummaryResultJson } from "./validators";

interface AnthropicMessage {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: "text"; text: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

function headers(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
    "anthropic-dangerous-direct-browser-access": "true"
  };
}

async function chatCompletion(
  settings: AnthropicSettings,
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 4096,
      system: systemPrompt + " Return strict JSON only.",
      messages: [
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Anthropic API failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as AnthropicMessage;
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("Anthropic response missing text content");
  }

  return {
    content: textBlock.text,
    tokenUsageIn: data.usage?.input_tokens ?? null,
    tokenUsageOut: data.usage?.output_tokens ?? null
  };
}

function extractJson(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Anthropic response");
  }
  return jsonMatch[0];
}

interface AnthropicModelsResponse {
  data?: Array<{ id: string }>;
}

export async function listModels(settings: AnthropicSettings): Promise<string[]> {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    headers: headers(settings.apiKey)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Anthropic models failed: ${response.status} ${text}`);
  }
  const data = (await response.json()) as AnthropicModelsResponse;
  return data.data?.map((m) => m.id) ?? [];
}

export async function checkChat(settings: AnthropicSettings): Promise<void> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: headers(settings.apiKey),
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Hi" }]
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Anthropic check failed: ${response.status} ${errorText}`);
  }
}

export async function generateSummary(
  settings: AnthropicSettings,
  input: { bookmarkTitle: string; url: string; pageTitle: string; contentText: string }
): Promise<{ result: SummaryResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const { content, tokenUsageIn, tokenUsageOut } = await chatCompletion(
    settings,
    SUMMARY_SYSTEM_PROMPT,
    buildSummaryUserPrompt(input)
  );

  return {
    result: parseSummaryResultJson(extractJson(content)),
    tokenUsageIn,
    tokenUsageOut
  };
}

export async function answerQuery(
  settings: AnthropicSettings,
  question: string,
  retrievedRecordsJson: string
): Promise<{ result: AskAnswerResult; tokenUsageIn: number | null; tokenUsageOut: number | null }> {
  const { content, tokenUsageIn, tokenUsageOut } = await chatCompletion(
    settings,
    ANSWER_SYSTEM_PROMPT,
    buildAnswerUserPrompt(question, retrievedRecordsJson)
  );

  return {
    result: parseAskAnswerResultJson(extractJson(content)),
    tokenUsageIn,
    tokenUsageOut
  };
}
