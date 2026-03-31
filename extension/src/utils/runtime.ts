import type { RuntimeRequest, RuntimeResponse } from "../types/messages";
import { api } from "./browser-api";

export async function sendRuntimeMessage(message: RuntimeRequest): Promise<RuntimeResponse> {
  return await api.runtime.sendMessage(message);
}

