# Tribe Sentinel Methodology

This document describes the analytical methods, assumptions, limitations, and evidence standards used by Tribe Sentinel.

## 1. Scope

Tribe Sentinel is an independent analytics toolkit for Tribe.run token markets on Solana.

The project currently analyzes:

- constant-product AMM behavior
- transaction fees
- token concentration
- sell-pressure scenarios
- holder distributions
- wallet-cluster evidence
- machine-readable risk reports

Tribe Sentinel does not identify the real-world owner of a wallet and does not classify any wallet as malicious without sufficient evidence.

## 2. Evidence Classification

Every analytical result should be classified into one of the following categories.

### Confirmed On-Chain Fact

Directly observable from Solana data.

Examples:

- token balance
- transaction signature
- sender and recipient accounts
- transaction timestamp
- SOL transfer amount
- token transfer amount
- program interaction
- account funding relationship

### Deterministic Calculation

Calculated from confirmed data using a documented formula.

Examples:

- holder share
- Top 10 concentration
- HHI
- AMM invariant
- estimated price impact
- fee amount
- simulated SOL output

### Analytical Inference

Supported by evidence but not conclusively proven.

Examples:

- two wallets may be controlled by the same entity
- several wallets may belong to one coordinated cluster
- a transfer may represent internal fund consolidation
- repeated sell behavior may indicate elevated sell-side risk

### Unknown

Information that cannot be confirmed from the available data.

Unknown values must not be presented as facts.

## 3. AMM Model

The current AMM engine uses a constant-product model:

```text
x × y = k
```

Where:

- `x` is the AMM token reserve
- `y` is the effective SOL reserve
- `k` is the constant-product invariant

The marginal token price is estimated as:

```text
price = effective SOL reserve / token reserve
```

A purchase increases the effective SOL reserve and decreases the token reserve.

A sale increases the token reserve and decreases the effective SOL reserve.

## 4. Virtual Reserves

Tribe-style markets may use virtual liquidity for pricing.

An effective or virtual SOL reserve:

- affects the AMM price curve
- may not equal the real SOL held by an on-chain vault
- must not be interpreted as withdrawable liquidity without additional verification

Tribe Sentinel keeps virtual reserves separate from assumptions about real vault balances.

## 5. Trading Fees

The AMM engine accepts a configurable fee expressed in basis points.

```text
100 basis points = 1%
300 basis points = 3%
```

For purchases:

```text
effective input = gross input - fee
```

For sales:

```text
net SOL output = gross SOL output - fee
```

Fee-recipient roles should only be named when confirmed by program instructions, documentation, account labels, or other reliable evidence.

Matching transfer percentages alone may support an inference but do not prove the identity or purpose of a recipient.

## 6. Token Concentration

Holder concentration is calculated from positive token balances.

### Top 1 Share

The percentage of total supply held by the largest address.

### Top 5 Share

The combined percentage held by the five largest addresses.

### Top 10 Share

The combined percentage held by the ten largest addresses.

All shares are represented internally in basis points.

```text
1 basis point = 0.01%
10,000 basis points = 100%
```

## 7. Herfindahl-Hirschman Index

The Herfindahl-Hirschman Index measures concentration.

```text
HHI = sum of each holder's squared supply share
```

Tribe Sentinel reports HHI on a scale from 0 to 10,000.

Examples:

- one holder owns 100%: HHI = 10,000
- four holders each own 25%: HHI = 2,500
- widely distributed ownership: lower HHI

The current implementation uses JavaScript number arithmetic for the final normalized HHI calculation. Token balances remain stored as bigint.

## 8. Concentration Risk Levels

The current demonstration thresholds are:

### CRITICAL

Triggered when any condition is met:

- largest holder owns at least 20%
- Top 10 holders own at least 70%
- HHI is at least 2,500

### HIGH

Triggered when any condition is met:

- largest holder owns at least 10%
- Top 10 holders own at least 50%
- HHI is at least 1,500

### MODERATE

Triggered when any condition is met:

- largest holder owns at least 5%
- Top 10 holders own at least 30%
- HHI is at least 800

### LOW

Assigned when none of the above conditions are met.

These thresholds are transparent analytical defaults. They are not universal financial standards and may be revised as Tribe-specific market data becomes available.

## 9. Wallet-Cluster Analysis

Wallet clustering is probabilistic.

Potential evidence includes:

- shared SOL funding source
- funding within a narrow time window
- synchronized purchases
- repeated matching transaction sizes
- token transfers between wallets
- proceeds consolidated into one address
- shared interaction patterns
- common withdrawal destination

A cluster should include:

- supporting evidence
- confidence score
- known limitations
- alternative explanations

A cluster must not be described as common ownership unless the evidence is conclusive.

## 10. Sell-Pressure Stress Testing

The stress-testing module simulates partial or complete liquidation of a wallet balance.

Default scenarios:

- 10%
- 25%
- 50%
- 100%

Each scenario starts from the same initial AMM state. The scenarios are independent and are not executed sequentially.

Outputs include:

- token amount sold
- gross SOL output
- trading fee
- net SOL output
- remaining wallet balance
- estimated price impact
- resulting AMM reserves

Stress-test results are deterministic model estimates, not predictions of future market behavior.

## 11. Market Capitalization

Estimated market capitalization is calculated using the marginal AMM price:

```text
market capitalization = marginal price × total token supply
```

This value does not represent:

- real liquidity
- withdrawable SOL
- aggregate historical investment
- the amount all holders could receive by selling simultaneously

Large trades can change marginal price significantly.

## 12. Precision

Tribe Sentinel uses:

- `bigint` for raw token amounts
- `bigint` for lamports
- decimal strings when exporting raw amounts to JSON
- `number` only for display-oriented ratios and percentages

JSON does not support bigint values. Raw integer balances are therefore serialized as decimal strings to avoid precision loss.

## 13. Data Quality

Analysis quality depends on:

- RPC completeness
- correct token decimals
- accurate total supply
- reliable transaction history
- correct AMM program interpretation
- complete holder snapshots
- correct identification of excluded system accounts

Incomplete data must be disclosed in the report.

## 14. Known Limitations

The current v0.1 implementation:

- uses synthetic demonstration holder data
- does not yet fetch live Solana RPC data
- does not yet decode all Tribe.run program instructions
- does not automatically exclude creator, treasury, LP, burn, or vault accounts
- does not yet perform production wallet-cluster detection
- does not prove wallet ownership or intent
- does not provide financial advice

## 15. Planned Improvements

Future versions may include:

- live Solana RPC indexing
- Tribe.run instruction decoding
- real holder snapshot ingestion
- account-role classification
- cluster-adjusted concentration
- historical holder changes
- automated monitoring
- report comparison
- public dashboards
- configurable risk policies

## 16. Responsible Use

Tribe Sentinel is intended for research, transparency, and risk analysis.

It must not be used to:

- bypass platform restrictions
- manipulate markets
- front-run users
- coordinate artificial volume
- expose private keys
- make unsupported accusations
- present probabilistic wallet relationships as confirmed identity
