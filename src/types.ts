/** Transaction call object for estimation */
export interface TransactionCall {
  from?: string;
  to: string;
  data?: string;
  value?: string;
}

/** Breakdown of gas estimate for MegaETH */
export interface GasEstimate {
  /** Total gas estimate from eth_estimateGas */
  totalGas: bigint;
  /** Compute gas component (intrinsic: 21,000) */
  computeGas: bigint;
  /** Storage gas component (intrinsic: 39,000) */
  storageGas: bigint;
  /** Gas price (wei) */
  gasPrice: bigint;
  /** Total cost = totalGas * gasPrice (wei) */
  totalFee: bigint;
  /** Total cost in ETH */
  estimatedCostEth: string;
  /** Total cost in USD (if ethPrice provided) */
  estimatedCostUsd: string | null;
}

/** Comparison between MegaETH and Ethereum gas costs */
export interface GasComparison {
  megaeth: GasEstimate;
  ethereum: {
    gasEstimate: bigint;
    gasPrice: bigint;
    estimatedCostEth: string;
    estimatedCostUsd: string | null;
  } | null;
  savings: {
    percentage: string;
    absoluteEth: string;
  } | null;
}

/** RPC configuration */
export interface RpcConfig {
  megaethRpc: string;
  ethereumRpc?: string;
  ethPriceUsd?: number;
  /** Gas limit multiplier (default 1.2) */
  gasLimitMultiplier?: number;
}

/** Preset transaction types */
export type PresetType =
  | "transfer"
  | "erc20-transfer"
  | "erc20-approve"
  | "swap"
  | "nft-mint"
  | "deploy";
