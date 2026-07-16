/**
 * Solana RPC client used by Tribe Sentinel.
 *
 * The RPC URL can be supplied through SOLANA_RPC_URL.
 * It falls back to the public Solana mainnet endpoint for
 * development and low-volume analysis.
 */

import {
  Connection,
  PublicKey,
  type Commitment,
} from "@solana/web3.js";

const DEFAULT_RPC_URL =
  "https://api.mainnet-beta.solana.com";

const DEFAULT_COMMITMENT: Commitment =
  "confirmed";

export interface SolanaRpcConfig {
  rpcUrl?: string;
  commitment?: Commitment;
}

export function resolveRpcUrl(
  rpcUrl = process.env.SOLANA_RPC_URL,
): string {
  const resolved =
    rpcUrl?.trim() || DEFAULT_RPC_URL;

  try {
    const parsed = new URL(resolved);

    if (
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ) {
      throw new RangeError(
        "SOLANA_RPC_URL must use HTTP or HTTPS",
      );
    }
  } catch (error) {
    if (error instanceof RangeError) {
      throw error;
    }

    throw new RangeError(
      "SOLANA_RPC_URL must be a valid URL",
    );
  }

  return resolved;
}

export function createSolanaConnection(
  config: SolanaRpcConfig = {},
): Connection {
  return new Connection(
    resolveRpcUrl(config.rpcUrl),
    config.commitment ??
      DEFAULT_COMMITMENT,
  );
}

export function parsePublicKey(
  address: string,
  fieldName = "address",
): PublicKey {
  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) {
    throw new RangeError(
      `${fieldName} must not be empty`,
    );
  }

  try {
    return new PublicKey(trimmedAddress);
  } catch {
    throw new RangeError(
      `${fieldName} must be a valid Solana address`,
    );
  }
}