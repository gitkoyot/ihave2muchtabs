export type LogLevel = "debug" | "info" | "warn" | "error";

export interface DebugLogEntry {
  ts: string;
  level: LogLevel;
  scope: string;
  message: string;
  data?: string;
}

const DEBUG_LOGS_KEY = "debug_logs";
const MAX_LOG_ENTRIES = 300;

function toConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case "debug":
      return console.debug;
    case "info":
      return console.info;
    case "warn":
      return console.warn;
    case "error":
      return console.error;
  }
}

function stringifyData(data: unknown): string | undefined {
  if (data === undefined) return undefined;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

async function appendLog(entry: DebugLogEntry): Promise<void> {
  try {
    const existing = await chrome.storage.local.get(DEBUG_LOGS_KEY);
    const logs = ((existing[DEBUG_LOGS_KEY] as DebugLogEntry[] | undefined) ?? []).slice(-(MAX_LOG_ENTRIES - 1));
    logs.push(entry);
    await chrome.storage.local.set({ [DEBUG_LOGS_KEY]: logs });
  } catch (error) {
    console.error("Failed to persist debug log", error);
  }
}

export async function logDebug(scope: string, message: string, data?: unknown): Promise<void> {
  await log("debug", scope, message, data);
}

export async function logInfo(scope: string, message: string, data?: unknown): Promise<void> {
  await log("info", scope, message, data);
}

export async function logWarn(scope: string, message: string, data?: unknown): Promise<void> {
  await log("warn", scope, message, data);
}

export async function logError(scope: string, message: string, data?: unknown): Promise<void> {
  await log("error", scope, message, data);
}

async function log(level: LogLevel, scope: string, message: string, data?: unknown): Promise<void> {
  const dataString = stringifyData(data);
  const entryBase = {
    ts: new Date().toISOString(),
    level,
    scope,
    message
  };
  const entry: DebugLogEntry = dataString ? { ...entryBase, data: dataString } : entryBase;

  const consoleMethod = toConsoleMethod(level);
  if (entry.data) {
    consoleMethod(`[${entry.level}] [${entry.scope}] ${entry.message}`, entry.data);
  } else {
    consoleMethod(`[${entry.level}] [${entry.scope}] ${entry.message}`);
  }

  await appendLog(entry);
}

export async function getDebugLogs(): Promise<DebugLogEntry[]> {
  const data = await chrome.storage.local.get(DEBUG_LOGS_KEY);
  return ((data[DEBUG_LOGS_KEY] as DebugLogEntry[] | undefined) ?? []).slice();
}

export async function clearDebugLogs(): Promise<void> {
  await chrome.storage.local.set({ [DEBUG_LOGS_KEY]: [] });
}
