import { describe, it, expect } from "vitest";
import { formatEstimate, formatComparison, formatJson } from "../src/reporter.js";
import type { GasEstimate, GasComparison } from "../src/types.js";

const mockEstimate: GasEstimate = {
  totalGas: 72000n,
  computeGas: 33000n,
  storageGas: 39000n,
  gasPrice: 1000000n, // 0.001 gwei
  totalFee: 72000000000n,
  estimatedCostEth: "<0.00000001",
  estimatedCostUsd: "<$0.01",
};

const mockComparison: GasComparison = {
  megaeth: mockEstimate,
  ethereum: {
    gasEstimate: 21000n,
    gasPrice: 30000000000n,
    estimatedCostEth: "0.00063000",
    estimatedCostUsd: "$1.26",
  },
  savings: {
    percentage: "99.9%",
    absoluteEth: "<0.00000001",
  },
};

describe("formatEstimate", () => {
  it("includes total gas", () => {
    const output = formatEstimate(mockEstimate);
    expect(output).toContain("72,000");
  });

  it("includes compute gas", () => {
    const output = formatEstimate(mockEstimate);
    expect(output).toContain("33,000");
  });

  it("includes storage gas", () => {
    const output = formatEstimate(mockEstimate);
    expect(output).toContain("39,000");
  });

  it("includes dual gas label", () => {
    const output = formatEstimate(mockEstimate);
    expect(output).toContain("dual gas");
  });

  it("includes gas price", () => {
    const output = formatEstimate(mockEstimate);
    expect(output).toContain("Gas price");
  });

  it("includes estimated cost in ETH", () => {
    const output = formatEstimate(mockEstimate);
    expect(output).toContain("ETH");
  });

  it("includes label when provided", () => {
    const output = formatEstimate(mockEstimate, "Test Label");
    expect(output).toContain("Test Label");
  });
});

describe("formatComparison", () => {
  it("includes MegaETH section", () => {
    const output = formatComparison(mockComparison);
    expect(output).toContain("MegaETH");
  });

  it("shows dual gas model info", () => {
    const output = formatComparison(mockComparison);
    expect(output).toContain("dual gas");
  });

  it("includes compute and storage breakdown", () => {
    const output = formatComparison(mockComparison);
    expect(output).toContain("Compute gas");
    expect(output).toContain("Storage gas");
  });

  it("includes Ethereum section", () => {
    const output = formatComparison(mockComparison);
    expect(output).toContain("Ethereum L1");
  });

  it("includes savings", () => {
    const output = formatComparison(mockComparison);
    expect(output).toContain("99.9%");
    expect(output).toContain("cheaper on MegaETH");
  });

  it("handles no ethereum comparison", () => {
    const cmp: GasComparison = {
      megaeth: mockEstimate,
      ethereum: null,
      savings: null,
    };
    const output = formatComparison(cmp);
    expect(output).toContain("MegaETH");
    expect(output).not.toContain("Ethereum L1");
  });
});

describe("formatJson", () => {
  it("returns valid JSON", () => {
    const output = formatJson([
      { preset: "transfer", comparison: mockComparison },
    ]);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].preset).toBe("transfer");
  });

  it("serializes bigints as strings", () => {
    const output = formatJson([
      { preset: "transfer", comparison: mockComparison },
    ]);
    const parsed = JSON.parse(output);
    expect(parsed[0].megaeth.totalGas).toBe("72000");
    expect(parsed[0].megaeth.computeGas).toBe("33000");
    expect(parsed[0].megaeth.storageGas).toBe("39000");
  });

  it("includes dual gas breakdown", () => {
    const output = formatJson([
      { preset: "transfer", comparison: mockComparison },
    ]);
    const parsed = JSON.parse(output);
    expect(parsed[0].megaeth.computeGas).toBeDefined();
    expect(parsed[0].megaeth.storageGas).toBeDefined();
  });

  it("includes savings", () => {
    const output = formatJson([
      { preset: "transfer", comparison: mockComparison },
    ]);
    const parsed = JSON.parse(output);
    expect(parsed[0].savings.percentage).toBe("99.9%");
  });

  it("handles null ethereum", () => {
    const cmp: GasComparison = {
      megaeth: mockEstimate,
      ethereum: null,
      savings: null,
    };
    const output = formatJson([{ preset: "transfer", comparison: cmp }]);
    const parsed = JSON.parse(output);
    expect(parsed[0].ethereum).toBeNull();
  });
});
