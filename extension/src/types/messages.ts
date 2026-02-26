import type { AskAnswerResult, AzureOpenAISettings } from "./models";

export type RuntimeRequest =
  | { type: "GET_STATUS" }
  | { type: "GET_STATS" }
  | { type: "START_SCAN"; payload?: { folderIds?: string[] } }
  | { type: "ASK_QUERY"; payload: { question: string } }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; payload: AzureOpenAISettings }
  | { type: "EXPORT_JSONL" };

export type RuntimeResponse =
  | { ok: true; type: "STATUS"; payload: { status: string } }
  | { ok: true; type: "STATS"; payload: Record<string, unknown> }
  | { ok: true; type: "SCAN_STARTED"; payload: { jobId: string } }
  | { ok: true; type: "SETTINGS"; payload: AzureOpenAISettings | null }
  | { ok: true; type: "SETTINGS_SAVED" }
  | { ok: true; type: "ASK_RESULT"; payload: AskAnswerResult }
  | { ok: true; type: "EXPORT_DONE"; payload: { filename: string } }
  | { ok: false; error: string; details?: string };

