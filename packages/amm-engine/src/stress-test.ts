/**
 * Sell-pressure stress testing for Tribe-style AMM markets.
 *
 * This module simulates how partial or complete liquidation of a
 * wallet or wallet cluster may affect AMM reserves and token price.
 */

import {
  quoteSell,
  type AmmState,
  type SellQuote,
} from "./index.js";

const BASIS_POINTS_DENOMINATOR = 10_000n;

export interface SellStressScenario {
  /**
   * Percentage of the wallet balance being sold.
   *
   * Example: 2,500 basis points = 25%.
   */
  sellShareBps: number;

  tokenInput: bigint;
  remainingWalletBalance: bigint;
  grossSolOutputLamports: bigint;
  netSolOutputLamports: bigint;
  feeLamports: bigint;
  priceImpactPercent: number;
  stateAfter: AmmState;
}

export interface SellStressTestResult {
  walletBalance: bigint;
  feeBps: number;
  scenarios: SellStressScenario[];
}

function validateBasisPoints(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${fieldName} must be an integer`);
  }

  if (value <= 0 || value > 10_000) {
    throw new RangeError(
      `${fieldName} must be between 1 and 10,000`,
    );
  }
}

function buildScenario(
  state: AmmState,
  walletBalance: bigint,
  sellShareBps: number,
  feeBps: number,
): SellStressScenario {
  validateBasisPoints(sellShareBps, "sellShareBps");

  const tokenInput =
    (walletBalance * BigInt(sellShareBps)) /
    BASIS_POINTS_DENOMINATOR;

  if (tokenInput <= 0n) {
    throw new RangeError(
      "Calculated token input is too small",
    );
  }

  const quote: SellQuote = quoteSell(
    state,
    tokenInput,
    feeBps,
  );

  return {
    sellShareBps,
    tokenInput,
    remainingWalletBalance:
      walletBalance - tokenInput,
    grossSolOutputLamports:
      quote.grossSolOutputLamports,
    netSolOutputLamports:
      quote.netSolOutputLamports,
    feeLamports: quote.totalFeeLamports,
    priceImpactPercent:
      quote.priceImpactPercent,
    stateAfter: quote.stateAfter,
  };
}

/**
 * Runs multiple independent sell simulations against the same
 * starting AMM state.
 *
 * Each scenario starts from the original state. Scenarios are not
 * executed sequentially.
 */
export function runSellStressTest(
  state: AmmState,
  walletBalance: bigint,
  feeBps: number,
  sellSharesBps: readonly number[] = [
    1_000,
    2_500,
    5_000,
    10_000,
  ],
): SellStressTestResult {
  if (walletBalance <= 0n) {
    throw new RangeError(
      "walletBalance must be greater than zero",
    );
  }

  if (sellSharesBps.length === 0) {
    throw new RangeError(
      "At least one sell scenario is required",
    );
  }

  const uniqueSellShares = [
    ...new Set(sellSharesBps),
  ].sort((left, right) => left - right);

  const scenarios = uniqueSellShares.map(
    (sellShareBps) =>
      buildScenario(
        state,
        walletBalance,
        sellShareBps,
        feeBps,
      ),
  );

  return {
    walletBalance,
    feeBps,
    scenarios,
  };
}
