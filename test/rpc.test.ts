import { describe, it, expect, vi } from "vitest";
import { ethEstimateGas, ethGasPrice, getBlockGasLimit } from "../src/rpc.js";

describe("rpc functions", () => {
  it("ethEstimateGas sends correct JSON-RPC method", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "0xea60" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await ethEstimateGas("https://rpc.test", {
      from: "0x00",
      to: "0x01",
    });

    expect(result).toBe("0xea60");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe("eth_estimateGas");

    vi.unstubAllGlobals();
  });

  it("ethGasPrice sends correct JSON-RPC method", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "0x3b9aca00" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await ethGasPrice("https://rpc.test");
    expect(result).toBe("0x3b9aca00");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe("eth_gasPrice");

    vi.unstubAllGlobals();
  });

  it("getBlockGasLimit returns gas limit from latest block", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { gasLimit: "0x2540be400" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await getBlockGasLimit("https://rpc.test");
    expect(result).toBe("0x2540be400");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe("eth_getBlockByNumber");

    vi.unstubAllGlobals();
  });

  it("throws on HTTP error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      ethGasPrice("https://rpc.test")
    ).rejects.toThrow("RPC request failed: 500 Internal Server Error");

    vi.unstubAllGlobals();
  });

  it("throws on RPC error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          error: { code: -32000, message: "execution reverted" },
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      ethEstimateGas("https://rpc.test", { to: "0x00" })
    ).rejects.toThrow("RPC error: execution reverted (code -32000)");

    vi.unstubAllGlobals();
  });

  it("throws on missing result", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      ethGasPrice("https://rpc.test")
    ).rejects.toThrow("RPC returned no result");

    vi.unstubAllGlobals();
  });
});
