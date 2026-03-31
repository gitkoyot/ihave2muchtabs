import type { AskAnswerResult, LlmSettings, SummaryResult } from "../types/models";
import { generateSummary as azureSummary, generateEmbedding as azureEmbedding, answerQuery as azureAnswer, checkChat as azureCheckChat } from "./azureOpenAIClient";
import { generateSummary as anthropicSummary, answerQuery as anthropicAnswer, checkChat as anthropicCheckChat, listModels as anthropicListModels } from "./anthropicClient";
import { generateSummary as ollamaSummary, generateEmbedding as ollamaEmbedding, answerQuery as ollamaAnswer, checkChat as ollamaCheckChat, listModels as ollamaListModels } from "./ollamaClient";

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
    case "ollama":
      return ollamaSummary(settings.ollama, input);
  }
}

export function generateEmbedding(settings: LlmSettings, input: string): Promise<number[]> {
  switch (settings.embeddingProvider) {
    case "azure_openai":
      return azureEmbedding(settings.azure, input);
    case "ollama":
      return ollamaEmbedding(settings.ollama, input);
  }
}

export async function listModels(settings: LlmSettings): Promise<{ chat: string[]; embedding: string[] }> {
  let chat: string[];
  try {
    switch (settings.provider) {
      case "azure_openai":
        chat = ["(Azure: check your deployments in the Azure portal)"];
        break;
      case "anthropic":
        chat = await anthropicListModels(settings.anthropic);
        break;
      case "ollama":
        chat = await ollamaListModels(settings.ollama);
        break;
    }
  } catch (e) {
    chat = [`Error: ${e instanceof Error ? e.message : String(e)}`];
  }

  let embedding: string[];
  try {
    switch (settings.embeddingProvider) {
      case "azure_openai":
        embedding = ["(Azure: check your deployments in the Azure portal)"];
        break;
      case "ollama":
        embedding = await ollamaListModels(settings.ollama);
        break;
    }
  } catch (e) {
    embedding = [`Error: ${e instanceof Error ? e.message : String(e)}`];
  }

  return { chat, embedding };
}

export async function checkConnection(settings: LlmSettings): Promise<{ chat: string; embedding: string }> {
  let chat: string;
  try {
    switch (settings.provider) {
      case "azure_openai": await azureCheckChat(settings.azure); break;
      case "anthropic": await anthropicCheckChat(settings.anthropic); break;
      case "ollama": await ollamaCheckChat(settings.ollama); break;
    }
    chat = "ok";
  } catch (e) {
    chat = e instanceof Error ? e.message : String(e);
  }

  let embedding: string;
  try {
    await generateEmbedding(settings, "test");
    embedding = "ok";
  } catch (e) {
    embedding = e instanceof Error ? e.message : String(e);
  }

  return { chat, embedding };
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
    case "ollama":
      return ollamaAnswer(settings.ollama, question, retrievedRecordsJson);
  }
}
