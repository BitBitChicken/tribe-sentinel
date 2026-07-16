import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createSolanaConnection,
  parsePublicKey,
  resolveRpcUrl,
} from "./rpc-client.js";

describe("resolveRpcUrl", () => {
  it("uses the supplied RPC URL", () => {
    expect(
      resolveRpcUrl(
        "https://example-rpc.invalid",
      ),
    ).toBe(
      "https://example-rpc.invalid",
    );
  });

  it("rejects unsupported protocols", () => {
    expect(() =>
      resolveRpcUrl(
        "ftp://example.com",
      ),
    ).toThrow(
      "SOLANA_RPC_URL must use HTTP or HTTPS",
    );
  });

  it("rejects malformed URLs", () => {
    expect(() =>
      resolveRpcUrl(
        "not-a-url",
      ),
    ).toThrow(
      "SOLANA_RPC_URL must be a valid URL",
    );
  });
});

describe("parsePublicKey", () => {
  it("parses a valid Solana address", () => {
    const address =
      "11111111111111111111111111111111";

    expect(
      parsePublicKey(address).toBase58(),
    ).toBe(address);
  });

  it("rejects an empty address", () => {
    expect(() =>
      parsePublicKey("   "),
    ).toThrow(
      "address must not be empty",
    );
  });

  it("rejects an invalid address", () => {
    expect(() =>
      parsePublicKey(
        "not-a-solana-address",
      ),
    ).toThrow(
      "address must be a valid Solana address",
    );
  });
});

describe("createSolanaConnection", () => {
  it("creates a connection using a custom endpoint", () => {
    const connection =
      createSolanaConnection({
        rpcUrl:
          "https://example-rpc.invalid",
        commitment: "finalized",
      });

    expect(connection.rpcEndpoint).toBe(
      "https://example-rpc.invalid",
    );
  });
});