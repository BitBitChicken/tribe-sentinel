import { describe, expect, it } from "vitest";

import {
  analyzeConcentration,
  calculateHhi,
  classifyConcentrationRisk,
  type HolderBalance,
} from "./concentration.js";

const TOTAL_SUPPLY = 1_000_000_000n;

const HOLDERS: HolderBalance[] = [
  {
    address: "wallet-a",
    balance: 200_000_000n,
  },
  {
    address: "wallet-b",
    balance: 150_000_000n,
  },
  {
    address: "wallet-c",
    balance: 100_000_000n,
  },
  {
    address: "wallet-d",
    balance: 80_000_000n,
  },
  {
    address: "wallet-e",
    balance: 70_000_000n,
  },
  {
    address: "wallet-f",
    balance: 60_000_000n,
  },
  {
    address: "wallet-g",
    balance: 50_000_000n,
  },
  {
    address: "wallet-h",
    balance: 40_000_000n,
  },
  {
    address: "wallet-i",
    balance: 30_000_000n,
  },
  {
    address: "wallet-j",
    balance: 20_000_000n,
  },
  {
    address: "wallet-k",
    balance: 10_000_000n,
  },
];

describe("calculateHhi", () => {
  it("returns 10,000 when one holder owns the full supply", () => {
    expect(
      calculateHhi(
        [
          {
            address: "single-holder",
            balance: TOTAL_SUPPLY,
          },
        ],
        TOTAL_SUPPLY,
      ),
    ).toBe(10_000);
  });

  it("returns a lower HHI for distributed ownership", () => {
    const concentrated = calculateHhi(
      [
        {
          address: "wallet-a",
          balance: 800_000_000n,
        },
        {
          address: "wallet-b",
          balance: 200_000_000n,
        },
      ],
      TOTAL_SUPPLY,
    );

    const distributed = calculateHhi(
      [
        {
          address: "wallet-a",
          balance: 250_000_000n,
        },
        {
          address: "wallet-b",
          balance: 250_000_000n,
        },
        {
          address: "wallet-c",
          balance: 250_000_000n,
        },
        {
          address: "wallet-d",
          balance: 250_000_000n,
        },
      ],
      TOTAL_SUPPLY,
    );

    expect(distributed).toBeLessThan(concentrated);
  });
});

describe("classifyConcentrationRisk", () => {
  it("classifies critical concentration", () => {
    expect(
      classifyConcentrationRisk(
        7_000,
        2_000,
        2_500,
      ),
    ).toBe("CRITICAL");
  });

  it("classifies high concentration", () => {
    expect(
      classifyConcentrationRisk(
        5_000,
        1_000,
        1_500,
      ),
    ).toBe("HIGH");
  });

  it("classifies moderate concentration", () => {
    expect(
      classifyConcentrationRisk(
        3_000,
        500,
        800,
      ),
    ).toBe("MODERATE");
  });

  it("classifies low concentration", () => {
    expect(
      classifyConcentrationRisk(
        2_000,
        300,
        400,
      ),
    ).toBe("LOW");
  });
});

describe("analyzeConcentration", () => {
  it("sorts holders by balance", () => {
    const metrics = analyzeConcentration(
      [...HOLDERS].reverse(),
      TOTAL_SUPPLY,
    );

    expect(
      metrics.sortedHolders[0]?.address,
    ).toBe("wallet-a");

    expect(
      metrics.sortedHolders.at(-1)?.address,
    ).toBe("wallet-k");
  });

  it("calculates Top 1, Top 5, and Top 10 shares", () => {
    const metrics = analyzeConcentration(
      HOLDERS,
      TOTAL_SUPPLY,
    );

    expect(metrics.top1ShareBps).toBe(2_000);
    expect(metrics.top5ShareBps).toBe(6_000);
    expect(metrics.top10ShareBps).toBe(8_000);
  });

  it("identifies the largest holder", () => {
    const metrics = analyzeConcentration(
      HOLDERS,
      TOTAL_SUPPLY,
    );

    expect(metrics.largestHolderAddress).toBe(
      "wallet-a",
    );

    expect(metrics.largestHolderBalance).toBe(
      200_000_000n,
    );

    expect(metrics.largestHolderShareBps).toBe(
      2_000,
    );
  });

  it("returns the number of positive-balance holders", () => {
    const metrics = analyzeConcentration(
      [
        ...HOLDERS,
        {
          address: "zero-balance-wallet",
          balance: 0n,
        },
      ],
      TOTAL_SUPPLY,
    );

    expect(metrics.holderCount).toBe(
      HOLDERS.length,
    );
  });

  it("classifies the example distribution as critical", () => {
    const metrics = analyzeConcentration(
      HOLDERS,
      TOTAL_SUPPLY,
    );

    expect(metrics.riskLevel).toBe(
      "CRITICAL",
    );
  });

  it("does not mutate the original holder array", () => {
    const holders = [...HOLDERS];
    const snapshot = holders.map(
      (holder) => ({ ...holder }),
    );

    analyzeConcentration(
      holders,
      TOTAL_SUPPLY,
    );

    expect(holders).toEqual(snapshot);
  });

  it("returns empty metrics when no holders are supplied", () => {
    const metrics = analyzeConcentration(
      [],
      TOTAL_SUPPLY,
    );

    expect(metrics.holderCount).toBe(0);
    expect(metrics.largestHolderAddress).toBeNull();
    expect(metrics.largestHolderBalance).toBe(0n);
    expect(metrics.top1ShareBps).toBe(0);
    expect(metrics.top5ShareBps).toBe(0);
    expect(metrics.top10ShareBps).toBe(0);
    expect(metrics.hhi).toBe(0);
    expect(metrics.riskLevel).toBe("LOW");
  });

  it("rejects an invalid total supply", () => {
    expect(() =>
      analyzeConcentration(
        HOLDERS,
        0n,
      ),
    ).toThrow(
      "totalSupply must be greater than zero",
    );
  });

  it("rejects an empty holder address", () => {
    expect(() =>
      analyzeConcentration(
        [
          {
            address: "   ",
            balance: 100n,
          },
        ],
        TOTAL_SUPPLY,
      ),
    ).toThrow(
      "Holder address must not be empty",
    );
  });

  it("rejects a negative holder balance", () => {
    expect(() =>
      analyzeConcentration(
        [
          {
            address: "invalid-wallet",
            balance: -1n,
          },
        ],
        TOTAL_SUPPLY,
      ),
    ).toThrow(
      "Holder balance must not be negative",
    );
  });
});
