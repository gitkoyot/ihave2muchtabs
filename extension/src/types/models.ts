export type ProcessingStatus = "pending" | "processing" | "done" | "failed" | "restricted";

export type FetchStatus =
  | "ok"
  | "timeout"
  | "network_error"
  | "http_error"
  | "restricted"
  | "parse_error";

export interface TabRecord {
  id: string;
  tabId: string;
  url: string;
  tabTitle: string;
  sourceWindowId: number | null;
  sourceWindowLabel: string;
  capturedAt: number;
  processingStatus: ProcessingStatus;
  lastProcessedAt: number | null;
  lastErrorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PageAnalysis {
  id: string;
  recordId: string;
  documentId: string;
  pageTitle: string;
  finalUrl: string;
  httpStatus: number | null;
  fetchStatus: FetchStatus;
  contentHash: string | null;
  summaryShortEn: string;
  summaryDetailedEn: string;
  whyRelevantEn: string;
  tags: string[];
  topics: string[];
  technologies: string[];
  extractedLinks: string[];
  embedding: number[];
  modelChat: string;
  modelEmbedding: string;
  promptVersion: string;
  tokenUsageIn: number | null;
  tokenUsageOut: number | null;
  generationMs: number | null;
  analysisVersion: number;
  createdAt: number;
}

export interface PageDocument {
  id: string;
  canonicalUrl: string;
  domain: string;
  contentHash: string | null;
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface PageLink {
  id: string;
  documentId: string;
  toUrl: string;
  createdAt: number;
}

export type LlmProviderType = "azure_openai" | "anthropic" | "local";
export type EmbeddingProviderType = "azure_openai" | "local";

export interface AzureOpenAISettings {
  endpoint: string;
  apiKey: string;
  chatDeployment: string;
  embeddingDeployment: string;
  apiVersion: string;
}

export interface AnthropicSettings {
  apiKey: string;
  model: string;
}

export interface LocalModelSettings {
  endpoint: string;
  chatModel: string;
  embeddingModel: string;
}

export interface LlmSettings {
  provider: LlmProviderType;
  embeddingProvider: EmbeddingProviderType;
  azure: AzureOpenAISettings;
  anthropic: AnthropicSettings;
  local: LocalModelSettings;
  maxCharsPerPage: number;
  maxConcurrency: number;
}

export interface SummaryResult {
  summary_short: string;
  summary_detailed: string;
  why_relevant: string;
  tags: string[];
  topics: string[];
  technologies: string[];
  confidence: number;
}

export interface AskAnswerResult {
  answer: string;
  matched_urls: Array<{ url: string; reason: string }>;
  related_urls: Array<{ url: string; reason: string }>;
  confidence: number;
}

export interface QueryHistoryRecord {
  id: string;
  question: string;
  answer: string;
  matchedUrls: string[];
  relatedUrls: string[];
  modelChat: string;
  tokenUsageIn: number | null;
  tokenUsageOut: number | null;
  createdAt: number;
}

export interface CostMetrics {
  scan: {
    analyzedPages: number;
    tokenIn: number;
    tokenOut: number;
    tokensPerSecond: number;
  };
  query: {
    count: number;
    tokenIn: number;
    tokenOut: number;
  };
}
