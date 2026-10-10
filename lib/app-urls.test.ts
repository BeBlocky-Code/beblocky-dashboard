import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { authServiceServerUrl, authServiceUrl } from "./app-urls.ts";

const ORIGINAL = process.env["AUTH_SERVICE_INTERNAL_URL"];

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env["AUTH_SERVICE_INTERNAL_URL"];
  } else {
    process.env["AUTH_SERVICE_INTERNAL_URL"] = ORIGINAL;
  }
});

describe("authServiceServerUrl", () => {
  it("uses the internal Docker address when it is set", () => {
    process.env["AUTH_SERVICE_INTERNAL_URL"] = "http://auth-api:8080/";
    assert.equal(authServiceServerUrl(), "http://auth-api:8080");
  });

  it("falls back to the public auth-service URL", () => {
    delete process.env["AUTH_SERVICE_INTERNAL_URL"];
    assert.equal(authServiceServerUrl(), authServiceUrl());
    assert.equal(authServiceUrl().includes("auth-api"), false);
  });
});
