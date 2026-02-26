import type { AskAnswerResult, SummaryResult } from "../types/models";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("LLM response is not an object");
  }
  return value as Record<string, unknown>;
}

export function parseSummaryResultJson(content: string): SummaryResult {
  const obj = asObject(JSON.parse(content) as unknown);
  const summary_short = obj.summary_short;
  const summary_detailed = obj.summary_detailed;
  const why_relevant = obj.why_relevant;
  const tags = obj.tags;
  const topics = obj.topics;
  const confidence = obj.confidence;

  if (!isString(summary_short)) throw new Error("Invalid summary_short");
  if (!isString(summary_detailed)) throw new Error("Invalid summary_detailed");
  if (!isString(why_relevant)) throw new Error("Invalid why_relevant");
  if (!isStringArray(tags)) throw new Error("Invalid tags");
  if (!isStringArray(topics)) throw new Error("Invalid topics");
  if (!isNumber(confidence)) throw new Error("Invalid confidence");

  return {
    summary_short,
    summary_detailed,
    why_relevant,
    tags,
    topics,
    confidence
  };
}

function parseUrlReasonArray(value: unknown, field: string): Array<{ url: string; reason: string }> {
  if (!Array.isArray(value)) throw new Error(`Invalid ${field}`);
  return value.map((item) => {
    const obj = asObject(item);
    if (!isString(obj.url)) throw new Error(`Invalid ${field}.url`);
    if (!isString(obj.reason)) throw new Error(`Invalid ${field}.reason`);
    return { url: obj.url, reason: obj.reason };
  });
}

export function parseAskAnswerResultJson(content: string): AskAnswerResult {
  const obj = asObject(JSON.parse(content) as unknown);
  if (!isString(obj.answer)) throw new Error("Invalid answer");
  if (!isNumber(obj.confidence)) throw new Error("Invalid confidence");

  return {
    answer: obj.answer,
    matched_urls: parseUrlReasonArray(obj.matched_urls, "matched_urls"),
    related_urls: parseUrlReasonArray(obj.related_urls, "related_urls"),
    confidence: obj.confidence
  };
}
