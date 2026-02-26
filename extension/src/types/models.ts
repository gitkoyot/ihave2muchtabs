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
  extractedLinks: string[];
  embedding: number[];
  modelChat: string;
  modelEmbedding: string;
  promptVersion: string;
  tokenUsageIn: number | null;
  tokenUsageOut: number | null;
  analysisVersion: number;
  createdAt: number;
}

export interface AzureOpenAISettings {
  endpoint: string;
  apiKey: string;
  chatDeployment: string;
  embeddingDeployment: string;
  apiVersion: string;
  maxCharsPerPage: number;
  maxConcurrency: number;
}

export interface SummaryResult {
  summary_short: string;
  summary_detailed: string;
  why_relevant: string;
  tags: string[];
  topics: string[];
  confidence: number;
}

export interface AskAnswerResult {
  answer: string;
  matched_urls: Array<{ url: string; reason: string }>;
  related_urls: Array<{ url: string; reason: string }>;
  confidence: number;
}
