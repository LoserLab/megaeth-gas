import type { TransactionCall, GasEstimate, GasComparison, RpcConfig } from "./types.js";
import { ethEstimateGas, ethGasPrice } from "./rpc.js";

const STORAGE_GAS_INTRINSIC = 39000n;
const COMPUTE_GAS_INTRINSIC = 21000n;
const MIN_GAS = COMPUTE_GAS_INTRINSIC + STORAGE_GAS_INTRINSIC; // 60,000

export function weiToEth(wei: bigint): string {
  const eth = Number(wei) / 1e18;
  if (eth === 0) return "0.00000000";
  if (eth < 0.00000001) return "<0.00000001";
  return eth.toFixed(8);
}

export function toUsd(amountStr: string, price: number): string {
  const amount = parseFloat(amountStr);
  if (amount === 0) return "$0.00";
  const usd = amount * price;
  if (usd < 0.01) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

export function weiToGwei(wei: bigint): string {
  const gwei = Number(wei) / 1e9;
  if (gwei < 0.001) return "<0.001";
  return gwei.toFixed(3);
}

export async function estimateGas(
  tx: TransactionCall,
  config: RpcConfig
): Promise<GasEstimate> {
  const [gasHex, priceHex] = await Promise.all([
    ethEstimateGas(config.megaethRpc, tx),
    ethGasPrice(config.megaethRpc),
  ]);

  const totalGasEstimate = BigInt(gasHex);
  const gasPrice = BigInt(priceHex);

  const multiplier = config.gasLimitMultiplier ?? 1.2;
  const totalGas = BigInt(Math.ceil(Number(totalGasEstimate) * multiplier));

  // Break down into compute + storage components
  // Storage gas intrinsic is always 39,000 minimum per tx
  // Compute gas intrinsic is always 21,000 minimum per tx
  const storageGas = STORAGE_GAS_INTRINSIC;
  const computeGas = totalGas > MIN_GAS ? totalGas - STORAGE_GAS_INTRINSIC : COMPUTE_GAS_INTRINSIC;

  const totalFee = totalGas * gasPrice;
  const estimatedCostEth = weiToEth(totalFee);
  const estimatedCostUsd = config.ethPriceUsd
    ? toUsd(estimatedCostEth, config.ethPriceUsd)
    : null;

  return {
    totalGas,
    computeGas,
    storageGas,
    gasPrice,
    totalFee,
    estimatedCostEth,
    estimatedCostUsd,
  };
}

export async function compareGas(
  tx: TransactionCall,
  config: RpcConfig
): Promise<GasComparison> {
  const megaethEstimate = await estimateGas(tx, config);

  let ethereum: GasComparison["ethereum"] = null;
  let savings: GasComparison["savings"] = null;

  if (config.ethereumRpc) {
    try {
      const [ethGasHex, ethPriceHex] = await Promise.all([
        ethEstimateGas(config.ethereumRpc, tx),
        ethGasPrice(config.ethereumRpc),
      ]);

      const gasEstimate = BigInt(ethGasHex);
      const gasPrice = BigInt(ethPriceHex);
      const totalCostWei = gasEstimate * gasPrice;
      const estimatedCostEth = weiToEth(totalCostWei);
      const estimatedCostUsd = config.ethPriceUsd
        ? toUsd(estimatedCostEth, config.ethPriceUsd)
        : null;

      ethereum = { gasEstimate, gasPrice, estimatedCostEth, estimatedCostUsd };

      // Compare costs (both are in ETH)
      if (config.ethPriceUsd) {
        const megaethUsd = parseFloat(megaethEstimate.estimatedCostEth) * config.ethPriceUsd;
        const ethUsd = parseFloat(estimatedCostEth) * config.ethPriceUsd;
        if (ethUsd > 0) {
          const saved = ethUsd - megaethUsd;
          const pct = (saved / ethUsd) * 100;
          savings = {
            percentage: `${pct.toFixed(1)}%`,
            absoluteEth: weiToEth(megaethEstimate.totalFee),
          };
        }
      } else {
        const ethCost = gasEstimate * gasPrice;
        if (ethCost > 0n) {
          const saved = ethCost - megaethEstimate.totalFee;
          const pct = (Number(saved) / Number(ethCost)) * 100;
          savings = {
            percentage: `${pct.toFixed(1)}%`,
            absoluteEth: weiToEth(saved > 0n ? saved : -saved),
          };
        }
      }
    } catch {
      // Ethereum estimation failed
    }
  }

  return { megaeth: megaethEstimate, ethereum, savings };
}
