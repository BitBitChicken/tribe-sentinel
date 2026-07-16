/**
 * Fetches a live Solana token snapshot.
 *
 * The snapshot includes mint supply, decimals, and the largest
 * token accounts returned by the Solana RPC endpoint.
 */

import {
  type Connection,
  PublicKey,
} from "@solana/web3.js";

import {
  parsePublicKey,
} from "./rpc-client.js";

export interface LargestTokenAccount {
  tokenAccountAddress: string;
  amountRaw: bigint;
  decimals: number;
  uiAmount: number | null;
  uiAmountString: string;
}

export interface TokenSnapshot {
  mintAddress: string;
  totalSupplyRaw: bigint;
  decimals: number;
  uiAmountString: string;
  largestAccounts: LargestTokenAccount[];
  fetchedAt: string;
}

export async function fetchTokenSnapshot(
  connection: Connection,
  mintAddress: string,
): Promise<TokenSnapshot> {
  const mint = parsePublicKey(
    mintAddress,
    "mintAddress",
  );

  const [
    supplyResponse,
    largestAccountsResponse,
  ] = await Promise.all([
    connection.getTokenSupply(mint),
    connection.getTokenLargestAccounts(mint),
  ]);

  const decimals =
    supplyResponse.value.decimals;

const largestAccounts =
  largestAccountsResponse.value.map(
    (account) => ({
      tokenAccountAddress:
        account.address.toBase58(),
      amountRaw:
        BigInt(account.amount),
      decimals:
        account.decimals,
      uiAmount:
        account.uiAmount,
      uiAmountString:
        account.uiAmountString ??
        account.amount,
    }),
  );

  return {
    mintAddress:
      mint.toBase58(),
    totalSupplyRaw:
      BigInt(supplyResponse.value.amount),
    decimals,
uiAmountString:
  supplyResponse.value.uiAmountString ??
  supplyResponse.value.amount,
    largestAccounts,
    fetchedAt:
      new Date().toISOString(),
  };
}

export function calculateLargestAccountShareBps(
  amountRaw: bigint,
  totalSupplyRaw: bigint,
): number {
  if (amountRaw < 0n) {
    throw new RangeError(
      "amountRaw must not be negative",
    );
  }

  if (totalSupplyRaw <= 0n) {
    throw new RangeError(
      "totalSupplyRaw must be greater than zero",
    );
  }

  return Number(
    (amountRaw * 10_000n) /
      totalSupplyRaw,
  );
}

export function validateMintAddress(
  mintAddress: string,
): PublicKey {
  return parsePublicKey(
    mintAddress,
    "mintAddress",
  );
}