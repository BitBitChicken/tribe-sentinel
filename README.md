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
