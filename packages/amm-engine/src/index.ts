/**
 * Tribe Sentinel AMM Engine
 *
 * A deterministic constant-product AMM simulator designed for
 * research and risk analysis of Tribe.run token markets.
 *
 * All SOL values are represented in lamports.
 * All token values are represented in raw token units.
 */

export const BASIS_POINTS_DENOMINATOR = 10_000n;

export interface AmmState {
  /**
   * Tokens currently held by the AMM.
   */
  tokenReserve: bigint;

  /**
   * Effective SOL reserve used by the pricing curve.
   *
   * This may include virtual liquidity and does not necessarily
   * equal the amount of real SOL held by the on-chain vault.
   */
  virtualSolReserveLamports: bigint;
}

export interface FeeBreakdown {
  grossInputLamports: bigint;
  totalFeeLamports: bigint;
  effectiveInputLamports: bigint;
}

export interface BuyQuote {
  tokenOutput: bigint;
  averagePriceLamportsPerToken: number;
  priceImpactPercent: number;
  fees: FeeBreakdown;
  stateBefore: AmmState;
  stateAfter: AmmState;
}

export interface SellQuote {
  tokenInput: bigint;
  grossSolOutputLamports: bigint;
  netSolOutputLamports: bigint;
  totalFeeLamports: bigint;
  averagePriceLamportsPerToken: number;
  priceImpactPercent: number;
  stateBefore: AmmState;
  stateAfter: AmmState;
}

function assertPositive(value: bigint, fieldName: string): void {
  if (value <= 0n) {
    throw new RangeError(`${fieldName} must be greater than zero`);
  }
}

function assertFeeBasisPoints(feeBps: number): void {
  if (!Number.isInteger(feeBps)) {
    throw new TypeError("feeBps must be an integer");
  }

  if (feeBps < 0 || feeBps >= 10_000) {
    throw new RangeError("feeBps must be between 0 and 9,999");
  }
}

function cloneState(state: AmmState): AmmState {
  return {
    tokenReserve: state.tokenReserve,
    virtualSolReserveLamports: state.virtualSolReserveLamports,
  };
}

function validateState(state: AmmState): void {
  assertPositive(state.tokenReserve, "tokenReserve");
  assertPositive(
    state.virtualSolReserveLamports,
    "virtualSolReserveLamports",
  );
}

/**
 * Returns the constant-product invariant x * y.
 */
export function calculateInvariant(state: AmmState): bigint {
  validateState(state);

  return state.tokenReserve * state.virtualSolReserveLamports;
}

/**
 * Returns the current marginal price in lamports per raw token unit.
 *
 * This number is intended for analytics and display only.
 * Core AMM calculations remain entirely bigint-based.
 */
export function calculateMarginalPrice(state: AmmState): number {
  validateState(state);

  return (
    Number(state.virtualSolReserveLamports) /
    Number(state.tokenReserve)
  );
}

/**
 * Splits a gross SOL input into protocol fees and effective AMM input.
 */
export function calculateInputFees(
  grossInputLamports: bigint,
  feeBps: number,
): FeeBreakdown {
  assertPositive(grossInputLamports, "grossInputLamports");
  assertFeeBasisPoints(feeBps);

  const totalFeeLamports =
    (grossInputLamports * BigInt(feeBps)) /
    BASIS_POINTS_DENOMINATOR;

  return {
    grossInputLamports,
    totalFeeLamports,
    effectiveInputLamports:
      grossInputLamports - totalFeeLamports,
  };
}

/**
 * Quotes a token purchase without mutating the supplied AMM state.
 */
export function quoteBuy(
  state: AmmState,
  grossInputLamports: bigint,
  feeBps: number,
): BuyQuote {
  validateState(state);

  const fees = calculateInputFees(grossInputLamports, feeBps);
  const invariant = calculateInvariant(state);

  const nextSolReserve =
    state.virtualSolReserveLamports +
    fees.effectiveInputLamports;

  const nextTokenReserve = invariant / nextSolReserve;
  const tokenOutput = state.tokenReserve - nextTokenReserve;

  if (tokenOutput <= 0n) {
    throw new RangeError("Trade output is too small");
  }

  const stateAfter: AmmState = {
    tokenReserve: nextTokenReserve,
    virtualSolReserveLamports: nextSolReserve,
  };

  const priceBefore = calculateMarginalPrice(state);
  const priceAfter = calculateMarginalPrice(stateAfter);

  return {
    tokenOutput,
    averagePriceLamportsPerToken:
      Number(fees.effectiveInputLamports) /
      Number(tokenOutput),
    priceImpactPercent:
      ((priceAfter - priceBefore) / priceBefore) * 100,
    fees,
    stateBefore: cloneState(state),
    stateAfter,
  };
}

/**
 * Quotes a token sale without mutating the supplied AMM state.
 *
 * The fee is deducted from the gross SOL output.
 */
export function quoteSell(
  state: AmmState,
  tokenInput: bigint,
  feeBps: number,
): SellQuote {
  validateState(state);
  assertPositive(tokenInput, "tokenInput");
  assertFeeBasisPoints(feeBps);

  const invariant = calculateInvariant(state);
  const nextTokenReserve = state.tokenReserve + tokenInput;
  const nextSolReserve = invariant / nextTokenReserve;

  const grossSolOutputLamports =
    state.virtualSolReserveLamports - nextSolReserve;

  if (grossSolOutputLamports <= 0n) {
    throw new RangeError("Trade output is too small");
  }

  const totalFeeLamports =
    (grossSolOutputLamports * BigInt(feeBps)) /
    BASIS_POINTS_DENOMINATOR;

  const netSolOutputLamports =
    grossSolOutputLamports - totalFeeLamports;

  const stateAfter: AmmState = {
    tokenReserve: nextTokenReserve,
    virtualSolReserveLamports: nextSolReserve,
  };

  const priceBefore = calculateMarginalPrice(state);
  const priceAfter = calculateMarginalPrice(stateAfter);

  return {
    tokenInput,
    grossSolOutputLamports,
    netSolOutputLamports,
    totalFeeLamports,
    averagePriceLamportsPerToken:
      Number(netSolOutputLamports) /
      Number(tokenInput),
    priceImpactPercent:
      ((priceAfter - priceBefore) / priceBefore) * 100,
    stateBefore: cloneState(state),
    stateAfter,
  };
}
