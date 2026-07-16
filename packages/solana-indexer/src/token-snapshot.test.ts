import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateLargestAccountShareBps,
  validateMintAddress,
} from "./token-snapshot.js";

describe("calculateLargestAccountShareBps", () => {
  it("calculates a 20% supply share", () => {
    expect(
      calculateLargestAccountShareBps(
        200_000_000n,
        1_000_000_000n,
      ),
    ).toBe(2_000);
  });

  it("rounds down to whole basis points", () => {
    expect(
      calculateLargestAccountShareBps(
        1n,
        3n,
      ),
    ).toBe(3_333);
  });

  it("rejects a negative account balance", () => {
    expect(() =>
      calculateLargestAccountShareBps(
        -1n,
        1_000n,
      ),
    ).toThrow(
      "amountRaw must not be negative",
    );
  });

  it("rejects a non-positive total supply", () => {
    expect(() =>
      calculateLargestAccountShareBps(
        1n,
        0n,
      ),
    ).toThrow(
      "totalSupplyRaw must be greater than zero",
    );
  });
});

describe("validateMintAddress", () => {
  it("accepts a valid Solana address", () => {
    const address =
      "11111111111111111111111111111111";

    expect(
      validateMintAddress(address).toBase58(),
    ).toBe(address);
  });

  it("rejects an invalid mint address", () => {
    expect(() =>
      validateMintAddress(
        "invalid-mint",
      ),
    ).toThrow(
      "mintAddress must be a valid Solana address",
    );
  });
});