/**
 * Tribe Sentinel CLI
 *
 * Runs reproducible Tribe-style AMM launch,
 * sell-pressure, and concentration simulations.
 */

import {
  calculateMarginalPrice,
  quoteBuy,
  type AmmState,
} from "../../../packages/amm-engine/src/index.js";

import {
  runSellStressTest,
  type SellStressScenario,
} from "../../../packages/amm-engine/src/stress-test.js";

import {
  analyzeConcentration,
  type HolderBalance,
} from "../../../packages/risk-engine/src/concentration.js";

const LAMPORTS_PER_SOL = 1_000_000_000n;
const TOKEN_DECIMALS = 6;
const TOKEN_SCALE = 10n ** BigInt(TOKEN_DECIMALS);

const TOTAL_SUPPLY_TOKENS = 1_000_000_000n;
const TOTAL_SUPPLY_RAW =
  TOTAL_SUPPLY_TOKENS * TOKEN_SCALE;

const INITIAL_VIRTUAL_SOL = 35n;
const GROSS_BUY_AMOUNT_SOL = 25.69;
const TRADING_FEE_BPS = 300;

const STRESS_TEST_WALLET_TOKENS =
  100_000_000n;

const SAMPLE_HOLDERS: HolderBalance[] = [
  {
    address: "wallet-a",
    balance: 200_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-b",
    balance: 150_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-c",
    balance: 100_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-d",
    balance: 80_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-e",
    balance: 70_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-f",
    balance: 60_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-g",
    balance: 50_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-h",
    balance: 40_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-i",
    balance: 30_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-j",
    balance: 20_000_000n * TOKEN_SCALE,
  },
];

const initialState: AmmState = {
  tokenReserve: TOTAL_SUPPLY_RAW,
  virtualSolReserveLamports:
    INITIAL_VIRTUAL_SOL * LAMPORTS_PER_SOL,
};

function solToLamports(sol: number): bigint {
  if (!Number.isFinite(sol) || sol <= 0) {
    throw new RangeError(
      "SOL amount must be positive",
    );
  }

  return BigInt(
    Math.round(
      sol * Number(LAMPORTS_PER_SOL),
    ),
  );
}

function formatUnits(
  value: bigint,
  decimals: number,
  maximumFractionDigits = decimals,
): string {
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = value % scale;

  if (
    maximumFractionDigits === 0 ||
    fraction === 0n
  ) {
    return whole.toLocaleString("en-US");
  }

  const paddedFraction = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");

  return paddedFraction.length > 0
    ? `${whole.toLocaleString(
        "en-US",
      )}.${paddedFraction}`
    : whole.toLocaleString("en-US");
}

function formatSol(lamports: bigint): string {
  return `${formatUnits(
    lamports,
    9,
    9,
  )} SOL`;
}

function formatTokenAmount(
  rawAmount: bigint,
): string {
  return formatUnits(
    rawAmount,
    TOKEN_DECIMALS,
    6,
  );
}

function formatBasisPoints(
  basisPoints: number,
): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

function calculateMarketCapSol(
  state: AmmState,
): number {
  const marginalPriceLamports =
    calculateMarginalPrice(state);

  return (
    marginalPriceLamports *
    Number(TOTAL_SUPPLY_RAW) /
    Number(LAMPORTS_PER_SOL)
  );
}

function printDivider(): void {
  console.log("─".repeat(72));
}

function printLaunchSimulation(): AmmState {
  const quote = quoteBuy(
    initialState,
    solToLamports(GROSS_BUY_AMOUNT_SOL),
    TRADING_FEE_BPS,
  );

  const marketCapBefore =
    calculateMarketCapSol(
      quote.stateBefore,
    );

  const marketCapAfter =
    calculateMarketCapSol(
      quote.stateAfter,
    );

  const supplySharePercent =
    Number(quote.tokenOutput) /
    Number(TOTAL_SUPPLY_RAW) *
    100;

  console.log("");
  console.log("TRIBE SENTINEL");
  console.log("AMM Launch Simulation");
  printDivider();

  console.log(
    `Initial token supply:    ${TOTAL_SUPPLY_TOKENS.toLocaleString(
      "en-US",
    )}`,
  );

  console.log(
    `Initial virtual reserve: ${INITIAL_VIRTUAL_SOL} SOL`,
  );

  console.log(
    `Trading fee:             ${
      TRADING_FEE_BPS / 100
    }%`,
  );

  printDivider();

  console.log(
    `Gross input:             ${formatSol(
      quote.fees.grossInputLamports,
    )}`,
  );

  console.log(
    `Total fee:               ${formatSol(
      quote.fees.totalFeeLamports,
    )}`,
  );

  console.log(
    `Effective AMM input:     ${formatSol(
      quote.fees.effectiveInputLamports,
    )}`,
  );

  console.log(
    `Tokens received:         ${formatTokenAmount(
      quote.tokenOutput,
    )}`,
  );

  console.log(
    `Share of total supply:   ${supplySharePercent.toFixed(
      4,
    )}%`,
  );

  printDivider();

  console.log(
    `Market cap before:       ${marketCapBefore.toFixed(
      4,
    )} SOL`,
  );

  console.log(
    `Market cap after:        ${marketCapAfter.toFixed(
      4,
    )} SOL`,
  );

  console.log(
    `Price impact:            ${quote.priceImpactPercent.toFixed(
      4,
    )}%`,
  );

  return quote.stateAfter;
}

function printStressScenario(
  scenario: SellStressScenario,
): void {
  const sellPercentage =
    scenario.sellShareBps / 100;

  console.log(
    `Sell ${sellPercentage
      .toString()
      .padStart(3, " ")}% | ` +
      `Tokens: ${formatTokenAmount(
        scenario.tokenInput,
      ).padStart(18, " ")} | ` +
      `Net SOL: ${formatSol(
        scenario.netSolOutputLamports,
      ).padStart(19, " ")} | ` +
      `Impact: ${scenario.priceImpactPercent.toFixed(
        4,
      )}%`,
  );
}

function printSellPressureSimulation(
  state: AmmState,
): void {
  const walletBalance =
    STRESS_TEST_WALLET_TOKENS *
    TOKEN_SCALE;

  const result = runSellStressTest(
    state,
    walletBalance,
    TRADING_FEE_BPS,
  );

  console.log("");
  printDivider();
  console.log("Sell-Pressure Stress Test");
  printDivider();

  console.log(
    `Simulated wallet balance: ${STRESS_TEST_WALLET_TOKENS.toLocaleString(
      "en-US",
    )} tokens`,
  );

  console.log(
    "Each scenario starts from the same AMM state.",
  );

  printDivider();

  for (const scenario of result.scenarios) {
    printStressScenario(scenario);
  }

  printDivider();

  console.log(
    "Note: Results are deterministic AMM estimates, not price predictions.",
  );

  console.log(
    "Virtual reserves may differ from real on-chain vault balances.",
  );

  console.log("");
}

function printConcentrationAnalysis(): void {
  const metrics = analyzeConcentration(
    SAMPLE_HOLDERS,
    TOTAL_SUPPLY_RAW,
  );

  console.log("");
  printDivider();
  console.log("Token Concentration Analysis");
  printDivider();

  console.log(
    `Positive-balance holders: ${metrics.holderCount}`,
  );

  console.log(
    `Largest holder:           ${
      metrics.largestHolderAddress ?? "N/A"
    }`,
  );

  console.log(
    `Largest-holder share:     ${formatBasisPoints(
      metrics.largestHolderShareBps,
    )}`,
  );

  console.log(
    `Top 1 share:              ${formatBasisPoints(
      metrics.top1ShareBps,
    )}`,
  );

  console.log(
    `Top 5 share:              ${formatBasisPoints(
      metrics.top5ShareBps,
    )}`,
  );

  console.log(
    `Top 10 share:             ${formatBasisPoints(
      metrics.top10ShareBps,
    )}`,
  );

  console.log(
    `HHI:                      ${metrics.hhi}`,
  );

  console.log(
    `Risk level:               ${metrics.riskLevel}`,
  );

  printDivider();

  console.log(
    "Note: Sample holder data is used for demonstration.",
  );

  console.log(
    "Wallet-cluster-adjusted concentration will be added later.",
  );

  console.log("");
}

function main(): void {
  const stateAfterLaunch =
    printLaunchSimulation();

  printSellPressureSimulation(
    stateAfterLaunch,
  );

  printConcentrationAnalysis();
}

main();
