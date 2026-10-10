import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPrefetchRequest } from "./prefetch-request.ts";

function headers(values: Record<string, string>) {
  return (name: string) => values[name] ?? null;
}

describe("isPrefetchRequest", () => {
  it("matches App Router prefetch headers", () => {
    assert.equal(
      isPrefetchRequest(headers({ "next-router-prefetch": "1" })),
      true,
    );
    assert.equal(
      isPrefetchRequest(headers({ "next-router-segment-prefetch": "/courses" })),
      true,
    );
  });

  it("matches the purpose prefetch header", () => {
    assert.equal(isPrefetchRequest(headers({ purpose: "prefetch" })), true);
    assert.equal(isPrefetchRequest(headers({ "sec-purpose": "prefetch" })), true);
  });

  it("does not match a normal navigation", () => {
    assert.equal(isPrefetchRequest(headers({})), false);
    assert.equal(isPrefetchRequest(headers({ rsc: "1" })), false);
  });
});
