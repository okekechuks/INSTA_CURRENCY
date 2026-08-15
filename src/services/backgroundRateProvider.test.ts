import { describe, expect, it, vi } from "vitest";

import { GET_RATE_MESSAGE_TYPE } from "../types/messages";

import { createBackgroundRateProvider } from "./backgroundRateProvider";

describe("createBackgroundRateProvider", () => {
  it("requests rates from the extension background worker", async () => {
    const sendMessage = vi.fn(async () => ({
      ok: true as const,
      rate: {
        from: "USD" as const,
        rate: 1500,
        to: "NGN" as const,
        updatedAt: 500,
      },
    }));
    const provider = createBackgroundRateProvider(sendMessage);

    await expect(provider.getRate("USD", "NGN")).resolves.toEqual({
      from: "USD",
      rate: 1500,
      to: "NGN",
      updatedAt: 500,
    });
    expect(sendMessage).toHaveBeenCalledWith({
      from: "USD",
      to: "NGN",
      type: GET_RATE_MESSAGE_TYPE,
    });
  });

  it("rejects failed background responses", async () => {
    const sendMessage = vi.fn(async () => ({
      error: "Provider unavailable",
      ok: false as const,
    }));
    const provider = createBackgroundRateProvider(sendMessage);

    await expect(provider.getRate("USD", "NGN")).rejects.toThrow("Provider unavailable");
  });
});
