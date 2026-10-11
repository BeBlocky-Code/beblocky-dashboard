import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAcctOkCookieHeader,
  buildClearAcctOkCookieHeader,
  hashSessionToken,
  isAcctOkForToken,
  isRscNavigationRequest,
} from "./session-token.ts";

function headers(values: Record<string, string>) {
  return (name: string) => values[name] ?? null;
}

describe("hashSessionToken", () => {
  it("returns a short base64url hash", async () => {
    const hash = await hashSessionToken("test-token-123");
    assert.ok(hash.length > 0);
    assert.ok(hash.length <= 22);
    assert.ok(!hash.includes("="));
    assert.ok(!/[+/]/.test(hash));
  });

  it("is deterministic", async () => {
    const a = await hashSessionToken("same");
    const b = await hashSessionToken("same");
    assert.equal(a, b);
  });

  it("differs for different tokens", async () => {
    const a = await hashSessionToken("token-a");
    const b = await hashSessionToken("token-b");
    assert.notEqual(a, b);
  });
});

describe("isRscNavigationRequest", () => {
  it("matches rsc: 1", () => {
    assert.equal(isRscNavigationRequest(headers({ rsc: "1" })), true);
  });

  it("matches next-router-state-tree", () => {
    assert.equal(
      isRscNavigationRequest(headers({ "next-router-state-tree": "[]" })),
      true,
    );
  });

  it("does not match normal navigation", () => {
    assert.equal(isRscNavigationRequest(headers({})), false);
    assert.equal(isRscNavigationRequest(headers({ accept: "text/html" })), false);
  });
});

describe("buildAcctOkCookieHeader", () => {
  it("includes the hash and default max-age", () => {
    const header = buildAcctOkCookieHeader("hash123");
    assert.match(header, /acct_ok=hash123/);
    assert.match(header, /Max-Age=300/);
    assert.match(header, /HttpOnly/);
    assert.match(header, /SameSite=Lax/);
    assert.match(header, /Path=\//);
    assert.doesNotMatch(header, /Secure/);
  });

  it("adds Secure when requested", () => {
    const header = buildAcctOkCookieHeader("hash123", { secure: true });
    assert.match(header, /Secure/);
  });
});

describe("buildClearAcctOkCookieHeader", () => {
  it("clears the cookie", () => {
    const header = buildClearAcctOkCookieHeader();
    assert.match(header, /acct_ok=;/);
    assert.match(header, /Max-Age=0/);
  });
});

describe("isAcctOkForToken", () => {
  it("returns true for a matching token hash", async () => {
    const token = "my-session-token";
    const hash = await hashSessionToken(token);
    assert.equal(await isAcctOkForToken(token, hash), true);
  });

  it("returns false for a missing cookie", async () => {
    assert.equal(await isAcctOkForToken("token", undefined), false);
  });

  it("returns false for a mismatched cookie", async () => {
    assert.equal(await isAcctOkForToken("token", "wrong"), false);
  });
});
