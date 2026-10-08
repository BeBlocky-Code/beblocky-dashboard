import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_STUDENT_LIST_PATH,
  withIdentity,
} from "./student-identity.ts";

describe("ADMIN_STUDENT_LIST_PATH", () => {
  it("is the Nest list, not the Next.js same-host proxy", () => {
    assert.equal(ADMIN_STUDENT_LIST_PATH, "/students");
    assert.equal(ADMIN_STUDENT_LIST_PATH.startsWith("/api/admin"), false);
  });
});

describe("withIdentity", () => {
  it("keeps auth-service name and email", () => {
    const row = withIdentity({
      userId: "610d3385-9728-4053-a6cd-4034decb6c2a",
      name: "Ada",
      email: "ada@example.com",
    });
    assert.equal(row.name, "Ada");
    assert.equal(row.email, "ada@example.com");
    assert.equal(row.displayName, "Ada");
  });

  it("falls back to a shortened Account id when identity is missing", () => {
    const row = withIdentity({
      userId: "610d3385-9728-4053-a6cd-4034decb6c2a",
    });
    assert.equal(row.displayName, "Student 610d3385…");
  });
});
