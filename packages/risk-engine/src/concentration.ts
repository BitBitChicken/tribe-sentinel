/**
 * Token concentration analytics.
 *
 * Calculates holder concentration, HHI, and a transparent
 * concentration-risk classification from token balance snapshots.
 */

const BPS_DENOMINATOR = 10_000n;
const HHI_SCALE = 10_000;

export interface HolderBalance {
  address: string;
  balance: bigint;
}

export type ConcentrationRiskLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL";

export interface ConcentrationMetrics {
  totalSupply: bigint;
  holderCount: number;
  largestHolderAddress: string | null;
  largestHolderBalance: bigint;
  largestHolderShareBps: number;
  top1ShareBps: number;
  top5ShareBps: number;
  top10ShareBps: number;
  hhi: number;
  riskLevel: ConcentrationRiskLevel;
  sortedHolders: HolderBalance[];
}

function validateTotalSupply(totalSupply: bigint): void {
  if (totalSupply <= 0n) {
    throw new RangeError(
      "totalSupply must be greater than zero",
    );
  }
}

function validateHolder(
  holder: HolderBalance,
): void {
  if (holder.address.trim().length === 0) {
    throw new RangeError(
      "Holder address must not be empty",
    );
  }

  if (holder.balance < 0n) {
    throw new RangeError(
      "Holder balance must not be negative",
    );
  }
}

function calculateShareBps(
  balance: bigint,
  totalSupply: bigint,
): number {
  return Number(
    (balance * BPS_DENOMINATOR) /
      totalSupply,
  );
}

function sumBalances(
  holders: readonly HolderBalance[],
  limit: number,
): bigint {
  return holders
    .slice(0, limit)
    .reduce(
      (total, holder) =>
        total + holder.balance,
      0n,
    );
}

/**
 * Returns the Herfindahl-Hirschman Index on a 0-10,000 scale.
 *
 * A single holder owning 100% produces an HHI of 10,000.
 * A broadly distributed supply produces a lower score.
 */
export function calculateHhi(
  holders: readonly HolderBalance[],
  totalSupply: bigint,
): number {
  validateTotalSupply(totalSupply);

  let scaledSum = 0;

  for (const holder of holders) {
    validateHolder(holder);

    if (holder.balance === 0n) {
      continue;
    }

    const share =
      Number(holder.balance) /
      Number(totalSupply);

    scaledSum += share * share;
  }

  return Math.round(
    scaledSum * HHI_SCALE,
  );
}

export function classifyConcentrationRisk(
  top10ShareBps: number,
  largestHolderShareBps: number,
  hhi: number,
): ConcentrationRiskLevel {
  if (
    largestHolderShareBps >= 2_000 ||
    top10ShareBps >= 7_000 ||
    hhi >= 2_500
  ) {
    return "CRITICAL";
  }

  if (
    largestHolderShareBps >= 1_000 ||
    top10ShareBps >= 5_000 ||
    hhi >= 1_500
  ) {
    return "HIGH";
  }

  if (
    largestHolderShareBps >= 500 ||
    top10ShareBps >= 3_000 ||
    hhi >= 800
  ) {
    return "MODERATE";
  }

  return "LOW";
}

export function analyzeConcentration(
  holders: readonly HolderBalance[],
  totalSupply: bigint,
): ConcentrationMetrics {
  validateTotalSupply(totalSupply);

  for (const holder of holders) {
    validateHolder(holder);
  }

  const sortedHolders = holders
    .filter(
      (holder) => holder.balance > 0n,
    )
    .map((holder) => ({
      address: holder.address,
      balance: holder.balance,
    }))
    .sort((left, right) => {
      if (left.balance === right.balance) {
        return left.address.localeCompare(
          right.address,
        );
      }

      return left.balance > right.balance
        ? -1
        : 1;
    });

  const largestHolder =
    sortedHolders[0] ?? null;

  const top1Balance = sumBalances(
    sortedHolders,
    1,
  );

  const top5Balance = sumBalances(
    sortedHolders,
    5,
  );

  const top10Balance = sumBalances(
    sortedHolders,
    10,
  );

  const top1ShareBps = calculateShareBps(
    top1Balance,
    totalSupply,
  );

  const top5ShareBps = calculateShareBps(
    top5Balance,
    totalSupply,
  );

  const top10ShareBps = calculateShareBps(
    top10Balance,
    totalSupply,
  );

  const hhi = calculateHhi(
    sortedHolders,
    totalSupply,
  );

  const largestHolderShareBps =
    largestHolder === null
      ? 0
      : calculateShareBps(
          largestHolder.balance,
          totalSupply,
        );

  return {
    totalSupply,
    holderCount: sortedHolders.length,
    largestHolderAddress:
      largestHolder?.address ?? null,
    largestHolderBalance:
      largestHolder?.balance ?? 0n,
    largestHolderShareBps,
    top1ShareBps,
    top5ShareBps,
    top10ShareBps,
    hhi,
    riskLevel:
      classifyConcentrationRisk(
        top10ShareBps,
        largestHolderShareBps,
        hhi,
      ),
    sortedHolders,
  };
}
