import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMessage = vi.fn();

vi.mock("../src/utils/browser-api", () => ({
  api: {
    runtime: {
      sendMessage
    }
  }
}));

describe("sendRuntimeMessage", () => {
  beforeEach(() => {
    sendMessage.mockReset();
  });

  it("delegates to api.runtime.sendMessage", async () => {
    const response = { ok: true, type: "STATUS", payload: { status: "idle" } };
    sendMessage.mockResolvedValue(response);

    const { sendRuntimeMessage } = await import("../src/utils/runtime");

    await expect(sendRuntimeMessage({ type: "GET_STATUS" } as never)).resolves.toEqual(response);
    expect(sendMessage).toHaveBeenCalledWith({ type: "GET_STATUS" });
  });
});
