# Tribe Sentinel

> Open-source Solana intelligence and risk analytics for Tribe.run tokens.

Tribe Sentinel is an independent analytics toolkit designed to help token creators, communities, and researchers understand wallet concentration, AMM behavior, early accumulation, and potential sell-side risk across Tribe.run markets.

## Overview

Tribe.run connects GitHub repositories, token markets, creators, sponsors, and communities.

Tribe Sentinel adds an independent intelligence layer on top of public Solana data. It is designed to reconstruct token activity, identify concentration risks, analyze wallet behavior, and explain how Tribe AMM transactions affect price and liquidity.

## Core Features

- Tribe token holder analysis
- Wallet cluster detection
- Early buyer accumulation tracking
- Token concentration metrics
- Tribe AMM state reconstruction
- Buy and sell price-impact simulation
- Fee-flow decoding
- Sell-pressure and dump-risk analysis
- Evidence-based risk reports
- JSON and CSV data export

## Planned Modules

```text
tribe-sentinel/
├── packages/
│   ├── solana-indexer/
│   ├── tribe-decoder/
│   ├── amm-engine/
│   ├── cluster-engine/
│   ├── risk-engine/
│   └── shared/
├── apps/
│   ├── cli/
│   └── web/
├── docs/
└── tests/
```

## Analysis Principles

Tribe Sentinel separates confirmed on-chain facts from analytical inference.

Each wallet relationship may include:

- supporting evidence
- confidence score
- funding-source relationships
- transaction timing patterns
- token transfer relationships
- consolidation behavior

The system does not claim that multiple wallets belong to the same person unless sufficient evidence is available.

## Initial Roadmap

### v0.1

- Parse Solana token balances
- Analyze top token holders
- Calculate token concentration
- Simulate AMM buy and sell impact
- Generate a basic risk report

### v0.2

- Detect connected wallet clusters
- Analyze early accumulation
- Track realized and unrealized sell pressure
- Export JSON and CSV reports

### v0.3

- Launch a public analytics dashboard
- Add wallet relationship graphs
- Add historical AMM reconstruction
- Add automated monitoring and alerts

## Example Output

```text
Token: MADON
Supply: 1,000,000,000

Top 10 wallets: 61.42%
Detected clusters: 4
Largest detected cluster: 19.37%
Concentration risk: HIGH

AMM stress test:
Sell 10M tokens:  -4.8%
Sell 50M tokens: -19.6%
Sell 100M tokens: -32.4%
```

## Quick Start

### Requirements

- Node.js 20 or later
- npm

### Install

```bash
git clone https://github.com/BitBitChicken/tribe-sentinel.git
cd tribe-sentinel
npm ci
```

### Run the CLI demo

```bash
npm run demo
```

The demo currently includes:

- Tribe-style AMM launch simulation
- trading-fee calculation
- buy-side price impact
- sell-pressure stress testing
- Top 1, Top 5, and Top 10 holder concentration
- HHI concentration scoring
- transparent concentration-risk classification

### Run tests

```bash
npm test
```

### Run TypeScript checks

```bash
npm run typecheck
```

## Example CLI Output

```text
TRIBE SENTINEL
AMM Launch Simulation

Gross input:             25.69 SOL
Total fee:               0.7707 SOL
Effective AMM input:     24.9193 SOL

Sell-Pressure Stress Test

Sell  10% | Tokens: 10,000,000  | Net SOL: ... | Impact: ...
Sell  25% | Tokens: 25,000,000  | Net SOL: ... | Impact: ...
Sell  50% | Tokens: 50,000,000  | Net SOL: ... | Impact: ...
Sell 100% | Tokens: 100,000,000 | Net SOL: ... | Impact: ...

Token Concentration Analysis

Largest-holder share: 20.00%
Top 5 share:          60.00%
Top 10 share:         80.00%
HHI:                  928
Risk level:           CRITICAL
```

## Documentation

- [Methodology](docs/methodology.md)
- [Sample holder snapshot](examples/sample-holder-snapshot.json)

## Technology

- TypeScript
- Node.js
- Solana Web3.js
- Vitest
- PostgreSQL
- Next.js
- GitHub Actions

## Disclaimer

Tribe Sentinel is an independent open-source research project.

It is not affiliated with or endorsed by Tribe.run.

All analysis is based on publicly available blockchain data. Wallet-cluster detection and risk scoring may contain probabilistic inferences and should not be treated as definitive proof of ownership, identity, or misconduct.

This project does not provide financial advice.

## License

MIT
