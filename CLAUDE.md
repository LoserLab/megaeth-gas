# megaeth-gas

Gas estimator CLI for MegaETH blockchain.

## Commands

- `npm run build` — Build with tsup (CJS + ESM + types)
- `npm test` — Run vitest tests
- `npm run lint` — Type check with tsc

## Architecture

- `src/estimator.ts` — Core logic: gas estimation with dual gas breakdown (compute + storage)
- `src/rpc.ts` — JSON-RPC client (eth_estimateGas, eth_gasPrice)
- `src/presets.ts` — 6 preset transaction builders
- `src/reporter.ts` — ANSI terminal + JSON output
- `src/cli.ts` — Commander CLI
- `src/types.ts` — TypeScript interfaces

## Key concept

MegaETH uses a dual gas model: compute gas (21,000 intrinsic) + storage gas (39,000 intrinsic). Minimum gas per transaction is 60,000, not 21,000. Base fee is extremely low (0.001 gwei). Gas is paid in ETH (same as Ethereum L1). Block gas limit is 10 billion. EVM blocks are ~1s, mini blocks are ~10ms.

## MegaETH specifics

- Chain ID: 4326
- Mainnet RPC: https://mainnet.megaeth.com/rpc
- eth_estimateGas capped at 10,000,000 via RPC
- Per-tx resource limits: compute 200M, data 12.5MB, KV updates 500K, state growth 1K
- Storage gas costs: 39,000 base intrinsic, 20,000*(m-1) for zero-to-nonzero SSTORE

## Conventions

- Pure TypeScript, no runtime deps except commander
- Tests mock fetch for RPC calls
- Bigints for all wei values, converted to strings for JSON serialization
- Currency is ETH for both MegaETH and Ethereum estimates
- Gas breakdown shows compute + storage components separately
