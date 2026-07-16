import { describe, expect, it } from "vitest";

import type { AmmState } from "../../amm-engine/src/index.js";
import { runSellStressTest } from "../../amm-engine/src/stress-test.js";
import {
  analyzeConcentration,
  type HolderBalance,
} from "../../risk-engine/src/concentration.js";

import {
  REPORT_SCHEMA_VERSION,
  createAnalysisReport,
  stringifyAnalysisReport,
  type AnalysisReportInput,
} from "./json-report.js";

const TOKEN_DECIMALS = 6;
const TOKEN_SCALE =
  10n ** BigInt(TOKEN_DECIMALS);

const TOTAL_SUPPLY_RAW =
  1_000_000_000n * TOKEN_SCALE;

const HOLDERS: HolderBalance[] = [
  {
    address: "wallet-a",
    balance:
      200_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-b",
    balance:
      150_000_000n * TOKEN_SCALE,
  },
  {
    address: "wallet-c",
    balance:
      100_000_000n * TOKEN_SCALE,
  },
];

const AMM_STATE: AmmState = {
  tokenReserve: TOTAL_SUPPLY_RAW,
  virtualSolReserveLamports:
    35_000_000_000n,
};

function createValidInput(): AnalysisReportInput {
  return {
    token: {
      symbol: "MADON",
      mintAddress:
        "ExampleMintAddress111111111111111111111111",
      decimals: TOKEN_DECIMALS,
      totalSupplyRaw: TOTAL_SUPPLY_RAW,
      network: "solana-mainnet",
    },
    concentration:
      analyzeConcentration(
        HOLDERS,
        TOTAL_SUPPLY_RAW,
      ),
    sellPressure:
      runSellStressTest(
        AMM_STATE,
        100_000_000n * TOKEN_SCALE,
        300,
      ),
    generatedAt:
      "2026-07-16T10:00:00.000Z",
  };
}

describe("createAnalysisReport", () => {
  it("creates a versioned analysis report", () => {
    const report = createAnalysisReport(
      createValidInput(),
    );

    expect(report.schemaVersion).toBe(
      REPORT_SCHEMA_VERSION,
    );

    expect(report.generatedAt).toBe(
      "2026-07-16T10:00:00.000Z",
    );

    expect(report.token.symbol).toBe(
      "MADON",
    );

    expect(report.token.network).toBe(
      "solana-mainnet",
    );
  });

  it("preserves bigint precision as decimal strings", () => {
    const report = createAnalysisReport(
      createValidInput(),
    );

    expect(
      report.token.totalSupplyRaw,
    ).toBe(
      TOTAL_SUPPLY_RAW.toString(),
    );

    expect(
      report.concentration
        .largestHolderBalanceRaw,
    ).toBe(
      (
        200_000_000n *
        TOKEN_SCALE
      ).toString(),
    );

    expect(
      report.sellPressure
        .walletBalanceRaw,
    ).toBe(
      (
        100_000_000n *
        TOKEN_SCALE
      ).toString(),
    );
  });

  it("exports every sell-pressure scenario", () => {
    const input = createValidInput();

    const report =
      createAnalysisReport(input);

    expect(
      report.sellPressure.scenarios,
    ).toHaveLength(
      input.sellPressure.scenarios.length,
    );

    expect(
      report.sellPressure
        .scenarios[0]
        ?.tokenInputRaw,
    ).toBe(
      input.sellPressure
        .scenarios[0]
        ?.tokenInput
        .toString(),
    );
  });

  it("does not expose bigint values in the JSON report", () => {
    const report = createAnalysisReport(
      createValidInput(),
    );

    expect(() =>
      JSON.stringify(report),
    ).not.toThrow();
  });

  it("generates a timestamp when one is not supplied", () => {
    const input = createValidInput();

    delete input.generatedAt;

    const report =
      createAnalysisReport(input);

    expect(
      Number.isNaN(
        Date.parse(report.generatedAt),
      ),
    ).toBe(false);
  });

  it("rejects an empty token symbol", () => {
    const input = createValidInput();

    input.token.symbol = "   ";

    expect(() =>
      createAnalysisReport(input),
    ).toThrow(
      "Token symbol must not be empty",
    );
  });

  it("rejects an empty mint address", () => {
    const input = createValidInput();

    input.token.mintAddress = "";

    expect(() =>
      createAnalysisReport(input),
    ).toThrow(
      "Token mint address must not be empty",
    );
  });

  it("rejects invalid token decimals", () => {
    const input = createValidInput();

    input.token.decimals = 19;

    expect(() =>
      createAnalysisReport(input),
    ).toThrow(
      "Token decimals must be an integer between 0 and 18",
    );
  });

  it("rejects a non-positive total supply", () => {
    const input = createValidInput();

    input.token.totalSupplyRaw = 0n;

    expect(() =>
      createAnalysisReport(input),
    ).toThrow(
      "Token total supply must be greater than zero",
    );
  });

  it("rejects an invalid generated timestamp", () => {
    const input = createValidInput();

    input.generatedAt =
      "not-a-valid-date";

    expect(() =>
      createAnalysisReport(input),
    ).toThrow(
      "generatedAt must be a valid ISO timestamp",
    );
  });
});

describe("stringifyAnalysisReport", () => {
  it("creates valid formatted JSON", () => {
    const report = createAnalysisReport(
      createValidInput(),
    );

    const output =
      stringifyAnalysisReport(
        report,
        2,
      );

    const parsed =
      JSON.parse(output) as {
        schemaVersion: string;
        token: {
          symbol: string;
        };
      };

    expect(parsed.schemaVersion).toBe(
      REPORT_SCHEMA_VERSION,
    );

    expect(parsed.token.symbol).toBe(
      "MADON",
    );

    expect(output).toContain("\n");
  });

  it("supports compact JSON output", () => {
    const report = createAnalysisReport(
      createValidInput(),
    );

    const output =
      stringifyAnalysisReport(
        report,
        0,
      );

    expect(output).not.toContain("\n");
  });

  it("rejects invalid JSON spacing", () => {
    const report = createAnalysisReport(
      createValidInput(),
    );

    expect(() =>
      stringifyAnalysisReport(
        report,
        -1,
      ),
    ).toThrow(
      "JSON spacing must be an integer between 0 and 10",
    );

    expect(() =>
      stringifyAnalysisReport(
        report,
        11,
      ),
    ).toThrow(
      "JSON spacing must be an integer between 0 and 10",
    );

    expect(() =>
      stringifyAnalysisReport(
        report,
        1.5,
      ),
    ).toThrow(
      "JSON spacing must be an integer between 0 and 10",
    );
  });
});
