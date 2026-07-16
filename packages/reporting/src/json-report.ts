/**
 * JSON report generation for Tribe Sentinel.
 *
 * Blockchain balances are stored as bigint internally. Because JSON
 * does not support bigint values, all raw integer amounts are exported
 * as decimal strings to preserve exact precision.
 */

import type {
  ConcentrationMetrics,
} from "../../risk-engine/src/concentration.js";

import type {
  SellStressTestResult,
} from "../../amm-engine/src/stress-test.js";

export const REPORT_SCHEMA_VERSION = "1.0.0";

export interface TokenReportMetadata {
  symbol: string;
  mintAddress: string;
  decimals: number;
  totalSupplyRaw: bigint;
  network: "solana-mainnet" | "solana-devnet";
}

export interface AnalysisReportInput {
  token: TokenReportMetadata;
  concentration: ConcentrationMetrics;
  sellPressure: SellStressTestResult;
  generatedAt?: string;
}

export interface JsonStressScenario {
  sellShareBps: number;
  tokenInputRaw: string;
  remainingWalletBalanceRaw: string;
  grossSolOutputLamports: string;
  netSolOutputLamports: string;
  feeLamports: string;
  priceImpactPercent: number;
  stateAfter: {
    tokenReserveRaw: string;
    virtualSolReserveLamports: string;
  };
}

export interface JsonAnalysisReport {
  schemaVersion: string;
  generatedAt: string;
  token: {
    symbol: string;
    mintAddress: string;
    decimals: number;
    totalSupplyRaw: string;
    network: TokenReportMetadata["network"];
  };
  concentration: {
    holderCount: number;
    largestHolderAddress: string | null;
    largestHolderBalanceRaw: string;
    largestHolderShareBps: number;
    top1ShareBps: number;
    top5ShareBps: number;
    top10ShareBps: number;
    hhi: number;
    riskLevel: ConcentrationMetrics["riskLevel"];
  };
  sellPressure: {
    walletBalanceRaw: string;
    feeBps: number;
    scenarios: JsonStressScenario[];
  };
}

function validateIsoTimestamp(timestamp: string): void {
  const parsedTimestamp = Date.parse(timestamp);

  if (Number.isNaN(parsedTimestamp)) {
    throw new RangeError(
      "generatedAt must be a valid ISO timestamp",
    );
  }
}

function validateTokenMetadata(
  token: TokenReportMetadata,
): void {
  if (token.symbol.trim().length === 0) {
    throw new RangeError(
      "Token symbol must not be empty",
    );
  }

  if (token.mintAddress.trim().length === 0) {
    throw new RangeError(
      "Token mint address must not be empty",
    );
  }

  if (
    !Number.isInteger(token.decimals) ||
    token.decimals < 0 ||
    token.decimals > 18
  ) {
    throw new RangeError(
      "Token decimals must be an integer between 0 and 18",
    );
  }

  if (token.totalSupplyRaw <= 0n) {
    throw new RangeError(
      "Token total supply must be greater than zero",
    );
  }
}

function mapStressScenario(
  scenario: SellStressTestResult["scenarios"][number],
): JsonStressScenario {
  return {
    sellShareBps: scenario.sellShareBps,
    tokenInputRaw:
      scenario.tokenInput.toString(),
    remainingWalletBalanceRaw:
      scenario.remainingWalletBalance.toString(),
    grossSolOutputLamports:
      scenario.grossSolOutputLamports.toString(),
    netSolOutputLamports:
      scenario.netSolOutputLamports.toString(),
    feeLamports:
      scenario.feeLamports.toString(),
    priceImpactPercent:
      scenario.priceImpactPercent,
    stateAfter: {
      tokenReserveRaw:
        scenario.stateAfter.tokenReserve.toString(),
      virtualSolReserveLamports:
        scenario.stateAfter
          .virtualSolReserveLamports
          .toString(),
    },
  };
}

export function createAnalysisReport(
  input: AnalysisReportInput,
): JsonAnalysisReport {
  validateTokenMetadata(input.token);

  const generatedAt =
    input.generatedAt ??
    new Date().toISOString();

  validateIsoTimestamp(generatedAt);

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt,
    token: {
      symbol: input.token.symbol,
      mintAddress: input.token.mintAddress,
      decimals: input.token.decimals,
      totalSupplyRaw:
        input.token.totalSupplyRaw.toString(),
      network: input.token.network,
    },
    concentration: {
      holderCount:
        input.concentration.holderCount,
      largestHolderAddress:
        input.concentration
          .largestHolderAddress,
      largestHolderBalanceRaw:
        input.concentration
          .largestHolderBalance
          .toString(),
      largestHolderShareBps:
        input.concentration
          .largestHolderShareBps,
      top1ShareBps:
        input.concentration.top1ShareBps,
      top5ShareBps:
        input.concentration.top5ShareBps,
      top10ShareBps:
        input.concentration.top10ShareBps,
      hhi:
        input.concentration.hhi,
      riskLevel:
        input.concentration.riskLevel,
    },
    sellPressure: {
      walletBalanceRaw:
        input.sellPressure
          .walletBalance
          .toString(),
      feeBps:
        input.sellPressure.feeBps,
      scenarios:
        input.sellPressure.scenarios.map(
          mapStressScenario,
        ),
    },
  };
}

export function stringifyAnalysisReport(
  report: JsonAnalysisReport,
  spacing = 2,
): string {
  if (
    !Number.isInteger(spacing) ||
    spacing < 0 ||
    spacing > 10
  ) {
    throw new RangeError(
      "JSON spacing must be an integer between 0 and 10",
    );
  }

  return JSON.stringify(
    report,
    null,
    spacing,
  );
}
