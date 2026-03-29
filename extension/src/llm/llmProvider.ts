import type { AskAnswerResult, LlmSettings, SummaryResult } from "../types/models";
import { generateSummary as azureSummary, generateEmbedding as azureEmbedding, answerQuery as azureAnswer } from "./azureOpenAIClient";
import { generateSummary as anthropicSummary, answerQuery as anthropicAnswer } from "./anthropicClient";
import { generateSummary as copilotSummary, generateEmbedding as copilotEmbedding, answerQuery as copilotAnswer } from "./copilotClient";

export interface ChatResult {
  result: SummaryResult;
  tokenUsageIn: number | null;
  tokenUsageOut: number | null;
}

export interface AnswerResult {
  result: AskAnswerResult;
  tokenUsageIn: number | null;
  tokenUsageOut: number | null;
}

export interface SummaryInput {
  bookmarkTitle: string;
  url: string;
  pageTitle: string;
  contentText: string;
}

export function generateSummary(settings: LlmSettings, input: SummaryInput): Promise<ChatResult> {
  switch (settings.provider) {
    case "azure_openai":
      return azureSummary(settings.azure, input);
    case "anthropic":
      return anthropicSummary(settings.anthropic, input);
    case "copilot":
      return copilotSummary(settings.copilot, input);
  }
}

export function generateEmbedding(settings: LlmSettings, input: string): Promise<number[]> {
  switch (settings.embeddingProvider) {
    case "azure_openai":
      return azureEmbedding(settings.azure, input);
    case "copilot":
      return copilotEmbedding(settings.copilot, input);
  }
}

export function answerQuery(
  settings: LlmSettings,
  question: string,
  retrievedRecordsJson: string
): Promise<AnswerResult> {
  switch (settings.provider) {
    case "azure_openai":
      return azureAnswer(settings.azure, question, retrievedRecordsJson);
    case "anthropic":
      return anthropicAnswer(settings.anthropic, question, retrievedRecordsJson);
    case "copilot":
      return copilotAnswer(settings.copilot, question, retrievedRecordsJson);
  }
}
