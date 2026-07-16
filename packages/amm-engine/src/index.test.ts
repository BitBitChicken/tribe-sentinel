import { describe, expect, it } from "vitest";

import {
  calculateInputFees,
  calculateInvariant,
  calculateMarginalPrice,
  quoteBuy,
  quoteSell,
  type AmmState,
} from "./index";

const INITIAL_STATE: AmmState = {
  // 1 billion tokens with 6 decimals.
  tokenReserve: 1_000_000_000_000_000n,

  // 35 SOL expressed in lamports.
  virtualSolReserveLamports: 35_000_000_000n,
};

describe("calculateInvariant", () => {
  it("calculates the constant-product invariant", () => {
    expect(calculateInvariant(INITIAL_STATE)).toBe(
      INITIAL_STATE.tokenReserve *
        INITIAL_STATE.virtualSolReserveLamports,
    );
  });

  it("rejects an invalid AMM state", () => {
    expect(() =>
      calculateInvariant({
        tokenReserve: 0n,
        virtualSolReserveLamports: 35_000_000_000n,
      }),
    ).toThrow("tokenReserve must be greater than zero");
  });
});

describe("calculateMarginalPrice", () => {
  it("calculates the initial marginal price", () => {
    expect(calculateMarginalPrice(INITIAL_STATE)).toBeCloseTo(
      0.000035,
      12,
    );
  });
});

describe("calculateInputFees", () => {
  it("deducts a 3% fee from the gross SOL input", () => {
    const result = calculateInputFees(
      25_690_000_000n,
      300,
    );

    expect(result.grossInputLamports).toBe(
      25_690_000_000n,
    );

    expect(result.totalFeeLamports).toBe(
      770_700_000n,
    );

    expect(result.effectiveInputLamports).toBe(
      24_919_300_000n,
    );
  });

  it("rejects an invalid fee rate", () => {
    expect(() =>
      calculateInputFees(1_000_000_000n, 10_000),
    ).toThrow("feeBps must be between 0 and 9,999");
  });
});

describe("quoteBuy", () => {
  it("quotes a deterministic token purchase", () => {
    const quote = quoteBuy(
      INITIAL_STATE,
      1_000_000_000n,
      300,
    );

    expect(quote.fees.totalFeeLamports).toBe(
      30_000_000n,
    );

    expect(quote.fees.effectiveInputLamports).toBe(
      970_000_000n,
    );

    expect(quote.tokenOutput).toBeGreaterThan(0n);

    expect(
      quote.stateAfter.virtualSolReserveLamports,
    ).toBe(35_970_000_000n);

    expect(quote.stateAfter.tokenReserve).toBeLessThan(
      INITIAL_STATE.tokenReserve,
    );

    expect(quote.priceImpactPercent).toBeGreaterThan(0);
  });

  it("does not mutate the original AMM state", () => {
    const state = { ...INITIAL_STATE };

    quoteBuy(state, 1_000_000_000n, 300);

    expect(state).toEqual(INITIAL_STATE);
  });

  it("keeps rounding error below one reserve step", () => {
    const quote = quoteBuy(
      INITIAL_STATE,
      1_000_000_000n,
      300,
    );

    const invariantBefore =
      calculateInvariant(INITIAL_STATE);

    const invariantAfter =
      calculateInvariant(quote.stateAfter);

    const maximumRoundingDifference =
      quote.stateAfter.virtualSolReserveLamports;

    expect(invariantBefore - invariantAfter).toBeGreaterThanOrEqual(
      0n,
    );

    expect(invariantBefore - invariantAfter).toBeLessThan(
      maximumRoundingDifference,
    );
  });
});

describe("quoteSell", () => {
  it("quotes a deterministic token sale", () => {
    const quote = quoteSell(
      INITIAL_STATE,
      10_000_000_000n,
      300,
    );

    expect(quote.grossSolOutputLamports).toBeGreaterThan(
      0n,
    );

    expect(quote.netSolOutputLamports).toBeLessThan(
      quote.grossSolOutputLamports,
    );

    expect(quote.totalFeeLamports).toBeGreaterThan(0n);

    expect(quote.stateAfter.tokenReserve).toBeGreaterThan(
      INITIAL_STATE.tokenReserve,
    );

    expect(
      quote.stateAfter.virtualSolReserveLamports,
    ).toBeLessThan(
      INITIAL_STATE.virtualSolReserveLamports,
    );

    expect(quote.priceImpactPercent).toBeLessThan(0);
  });

  it("does not mutate the original AMM state", () => {
    const state = { ...INITIAL_STATE };

    quoteSell(state, 10_000_000_000n, 300);

    expect(state).toEqual(INITIAL_STATE);
  });

  it("rejects a zero token input", () => {
    expect(() =>
      quoteSell(INITIAL_STATE, 0n, 300),
    ).toThrow("tokenInput must be greater than zero");
  });
});
