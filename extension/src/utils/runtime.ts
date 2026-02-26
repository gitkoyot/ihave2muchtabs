import type { RuntimeRequest, RuntimeResponse } from "../types/messages";

export async function sendRuntimeMessage(message: RuntimeRequest): Promise<RuntimeResponse> {
  return await chrome.runtime.sendMessage(message);
}

