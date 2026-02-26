import type { AskAnswerResult, AzureOpenAISettings, CostMetrics } from "./models";
import type { DebugLogEntry } from "../debug/logger";

export type RuntimeRequest =
  | { type: "GET_STATUS" }
  | { type: "GET_STATS" }
  | { type: "START_SCAN"; payload?: { scope?: "all_tabs" | "current_window"; windowId?: number } }
  | { type: "ASK_QUERY"; payload: { question: string } }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; payload: AzureOpenAISettings }
  | { type: "EXPORT_JSONL" }
  | { type: "EXPORT_TXT" }
  | { type: "GET_DEBUG_LOGS" }
  | { type: "CLEAR_DEBUG_LOGS" }
  | { type: "CLOSE_ANALYZED_TABS"; payload?: { scope?: "all_tabs" | "current_window"; windowId?: number } }
  | { type: "CLEAR_DATABASE" }
  | { type: "GET_COST_METRICS" };

export type RuntimeResponse =
  | { ok: true; type: "STATUS"; payload: { status: string } }
  | { ok: true; type: "STATS"; payload: Record<string, unknown> }
  | { ok: true; type: "SCAN_STARTED"; payload: { jobId: string } }
  | { ok: true; type: "SETTINGS"; payload: AzureOpenAISettings | null }
  | { ok: true; type: "SETTINGS_SAVED" }
  | { ok: true; type: "ASK_RESULT"; payload: AskAnswerResult }
  | { ok: true; type: "EXPORT_DONE"; payload: { filename: string } }
  | { ok: true; type: "EXPORT_TXT_DONE"; payload: { filename: string } }
  | { ok: true; type: "CLOSE_ANALYZED_TABS_DONE"; payload: { closedCount: number; candidateCount: number } }
  | { ok: true; type: "DEBUG_LOGS"; payload: { logs: DebugLogEntry[] } }
  | { ok: true; type: "DEBUG_LOGS_CLEARED" }
  | { ok: true; type: "DATABASE_CLEARED" }
  | { ok: true; type: "COST_METRICS"; payload: CostMetrics }
  | { ok: false; error: string; details?: string };
