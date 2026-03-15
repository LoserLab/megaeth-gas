import type { GasEstimate, GasComparison, PresetType } from "./types.js";
import { weiToGwei } from "./estimator.js";
import { presetDescriptions } from "./presets.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

function line(label: string, value: string, color = WHITE): string {
  return `  ${DIM}${label.padEnd(24)}${RESET}${color}${value}${RESET}`;
}

/** Format a single MegaETH gas estimate */
export function formatEstimate(est: GasEstimate, label?: string): string {
  const lines: string[] = [];

  if (label) {
    lines.push(`${BOLD}${BLUE}${label}${RESET}`);
    lines.push("");
  }

  lines.push(`${BOLD}${WHITE}  MegaETH${RESET}  ${DIM}(dual gas: compute + storage)${RESET}`);
  lines.push(line("Total gas", est.totalGas.toLocaleString(), CYAN));
  lines.push(line("Compute gas", est.computeGas.toLocaleString(), CYAN));
  lines.push(line("Storage gas", est.storageGas.toLocaleString(), YELLOW));
  lines.push(line("Gas price", `${weiToGwei(est.gasPrice)} gwei`, CYAN));
  lines.push("");
  lines.push(line("Estimated cost", `${est.estimatedCostEth} ETH`, GREEN));
  if (est.estimatedCostUsd) {
    lines.push(line("", est.estimatedCostUsd, GREEN));
  }

  return lines.join("\n");
}

/** Format a full gas comparison */
export function formatComparison(cmp: GasComparison, label?: string): string {
  const lines: string[] = [];

  if (label) {
    lines.push(`${BOLD}${BLUE}${label}${RESET}`);
    lines.push("");
  }

  // MegaETH section
  lines.push(`${BOLD}${WHITE}  MegaETH${RESET}  ${DIM}(dual gas: compute + storage)${RESET}`);
  lines.push(line("Total gas", cmp.megaeth.totalGas.toLocaleString(), CYAN));
  lines.push(line("Compute gas", cmp.megaeth.computeGas.toLocaleString(), CYAN));
  lines.push(line("Storage gas", cmp.megaeth.storageGas.toLocaleString(), YELLOW));
  lines.push(line("Gas price", `${weiToGwei(cmp.megaeth.gasPrice)} gwei`, CYAN));
  lines.push(line("Estimated cost", `${cmp.megaeth.estimatedCostEth} ETH`, GREEN));
  if (cmp.megaeth.estimatedCostUsd) {
    lines.push(line("", cmp.megaeth.estimatedCostUsd, GREEN));
  }

  // Ethereum section
  if (cmp.ethereum) {
    lines.push("");
    lines.push(`${BOLD}${WHITE}  Ethereum L1${RESET}  ${DIM}(single gas dimension)${RESET}`);
    lines.push(line("Gas estimate", cmp.ethereum.gasEstimate.toLocaleString(), CYAN));
    lines.push(line("Gas price", `${weiToGwei(cmp.ethereum.gasPrice)} gwei`, CYAN));
    lines.push(line("Estimated cost", `${cmp.ethereum.estimatedCostEth} ETH`, YELLOW));
    if (cmp.ethereum.estimatedCostUsd) {
      lines.push(line("", cmp.ethereum.estimatedCostUsd, YELLOW));
    }
  }

  // Savings section
  if (cmp.savings) {
    lines.push("");
    const pct = parseFloat(cmp.savings.percentage);
    if (pct > 0) {
      lines.push(`  ${BOLD}${GREEN}\u2193 ${cmp.savings.percentage} cheaper on MegaETH${RESET}`);
    } else {
      lines.push(`  ${BOLD}${YELLOW}\u2191 ${cmp.savings.percentage.replace("-", "")} more expensive on MegaETH${RESET}`);
    }
  }

  return lines.join("\n");
}

/** Format preset comparison table */
export function formatPresetTable(
  results: Array<{ preset: PresetType; comparison: GasComparison }>
): string {
  const lines: string[] = [];

  lines.push(`${BOLD}${BLUE}megaeth-gas${RESET} ${DIM}v0.1.0${RESET}`);
  lines.push("");
  lines.push(`  ${RED}${BOLD}NOTE:${RESET} MegaETH uses a dual gas model (compute + storage).`);
  lines.push(`  ${DIM}Minimum gas per transaction is 60,000 (21k compute + 39k storage), not 21,000.${RESET}`);
  lines.push("");

  for (const { preset, comparison } of results) {
    const desc = presetDescriptions[preset];
    lines.push(formatComparison(comparison, desc));
    lines.push("");
    lines.push(`${DIM}${"─".repeat(50)}${RESET}`);
    lines.push("");
  }

  return lines.join("\n");
}

/** Format results as JSON */
export function formatJson(
  results: Array<{ preset: PresetType; comparison: GasComparison }>
): string {
  const serializable = results.map(({ preset, comparison }) => ({
    preset,
    description: presetDescriptions[preset],
    megaeth: {
      totalGas: comparison.megaeth.totalGas.toString(),
      computeGas: comparison.megaeth.computeGas.toString(),
      storageGas: comparison.megaeth.storageGas.toString(),
      gasPrice: comparison.megaeth.gasPrice.toString(),
      totalFee: comparison.megaeth.totalFee.toString(),
      estimatedCostEth: comparison.megaeth.estimatedCostEth,
      estimatedCostUsd: comparison.megaeth.estimatedCostUsd,
    },
    ethereum: comparison.ethereum
      ? {
          gasEstimate: comparison.ethereum.gasEstimate.toString(),
          gasPrice: comparison.ethereum.gasPrice.toString(),
          estimatedCostEth: comparison.ethereum.estimatedCostEth,
          estimatedCostUsd: comparison.ethereum.estimatedCostUsd,
        }
      : null,
    savings: comparison.savings,
  }));

  return JSON.stringify(serializable, null, 2);
}
