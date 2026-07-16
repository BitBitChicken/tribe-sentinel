import { describe, expect, it } from "vitest";

import type { AmmState } from "./index.js";
import { runSellStressTest } from "./stress-test.js";

const TOKEN_DECIMALS = 6n;
const TOKEN_SCALE = 10n ** TOKEN_DECIMALS;

const INITIAL_STATE: AmmState = {
  tokenReserve: 1_000_000_000n * TOKEN_SCALE,
  virtualSolReserveLamports: 35_000_000_000n,
};

const WALLET_BALANCE =
  100_000_000n * TOKEN_SCALE;

describe("runSellStressTest", () => {
  it("creates the default 10%, 25%, 50%, and 100% scenarios", () => {
    const result = runSellStressTest(
      INITIAL_STATE,
      WALLET_BALANCE,
      300,
    );

    expect(
      result.scenarios.map(
        (scenario) => scenario.sellShareBps,
      ),
    ).toEqual([
      1_000,
      2_500,
      5_000,
      10_000,
    ]);
  });

  it("calculates the correct token input for each scenario", () => {
    const result = runSellStressTest(
      INITIAL_STATE,
      WALLET_BALANCE,
      300,
    );

    const [
      tenPercent,
      twentyFivePercent,
      fiftyPercent,
      fullLiquidation,
    ] = result.scenarios;

    expect(tenPercent?.tokenInput).toBe(
      10_000_000n * TOKEN_SCALE,
    );

    expect(twentyFivePercent?.tokenInput).toBe(
      25_000_000n * TOKEN_SCALE,
    );

    expect(fiftyPercent?.tokenInput).toBe(
      50_000_000n * TOKEN_SCALE,
    );

    expect(fullLiquidation?.tokenInput).toBe(
      100_000_000n * TOKEN_SCALE,
    );
  });

  it("calculates the remaining wallet balance", () => {
    const result = runSellStressTest(
      INITIAL_STATE,
      WALLET_BALANCE,
      300,
    );

    const fullLiquidation =
      result.scenarios.at(-1);

    expect(
      fullLiquidation?.remainingWalletBalance,
    ).toBe(0n);
  });

  it("produces increasing SOL output for larger sales", () => {
    const result = runSellStressTest(
      INITIAL_STATE,
      WALLET_BALANCE,
      300,
    );

    const outputs = result.scenarios.map(
      (scenario) =>
        scenario.netSolOutputLamports,
    );

    expect(outputs[1]).toBeGreaterThan(outputs[0] ?? 0n);
    expect(outputs[2]).toBeGreaterThan(outputs[1] ?? 0n);
    expect(outputs[3]).toBeGreaterThan(outputs[2] ?? 0n);
  });

  it("produces progressively larger negative price impact", () => {
    const result = runSellStressTest(
      INITIAL_STATE,
      WALLET_BALANCE,
      300,
    );

    const impacts = result.scenarios.map(
      (scenario) =>
        scenario.priceImpactPercent,
    );

    expect(impacts[0]).toBeLessThan(0);
    expect(impacts[1]).toBeLessThan(impacts[0] ?? 0);
    expect(impacts[2]).toBeLessThan(impacts[1] ?? 0);
    expect(impacts[3]).toBeLessThan(impacts[2] ?? 0);
  });

  it("deducts fees from gross SOL output", () => {
    const result = runSellStressTest(
      INITIAL_STATE,
      WALLET_BALANCE,
      300,
    );

    for (const scenario of result.scenarios) {
      expect(
        scenario.netSolOutputLamports,
      ).toBeLessThan(
        scenario.grossSolOutputLamports,
      );

      expect(scenario.feeLamports).toBeGreaterThan(0n);

      expect(
        scenario.netSolOutputLamports +
          scenario.feeLamports,
      ).toBe(
        scenario.grossSolOutputLamports,
      );
    }
  });

  it("does not mutate the original AMM state", () => {
    const state = { ...INITIAL_STATE };

    runSellStressTest(
      state,
      WALLET_BALANCE,
      300,
    );

    expect(state).toEqual(INITIAL_STATE);
  });

  it("removes duplicate scenarios and sorts them", () => {
    const result = runSellStressTest(
      INITIAL_STATE,
      WALLET_BALANCE,
      300,
      [
        5_000,
        1_000,
        5_000,
        2_500,
      ],
    );

    expect(
      result.scenarios.map(
        (scenario) => scenario.sellShareBps,
      ),
    ).toEqual([
      1_000,
      2_500,
      5_000,
    ]);
  });

  it("rejects a zero wallet balance", () => {
    expect(() =>
      runSellStressTest(
        INITIAL_STATE,
        0n,
        300,
      ),
    ).toThrow(
      "walletBalance must be greater than zero",
    );
  });

  it("rejects an empty scenario list", () => {
    expect(() =>
      runSellStressTest(
        INITIAL_STATE,
        WALLET_BALANCE,
        300,
        [],
      ),
    ).toThrow(
      "At least one sell scenario is required",
    );
  });

  it("rejects invalid sell percentages", () => {
    expect(() =>
      runSellStressTest(
        INITIAL_STATE,
        WALLET_BALANCE,
        300,
        [0],
      ),
    ).toThrow(
      "sellShareBps must be between 1 and 10,000",
    );

    expect(() =>
      runSellStressTest(
        INITIAL_STATE,
        WALLET_BALANCE,
        300,
        [10_001],
      ),
    ).toThrow(
      "sellShareBps must be between 1 and 10,000",
    );
  });
});
