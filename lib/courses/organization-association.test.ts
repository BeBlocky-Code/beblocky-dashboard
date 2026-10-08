import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountRoles,
  courseCatalogAccess,
  teacherNeedsOrganization,
} from "./organization-association.ts";

describe("accountRoles", () => {
  it("prefers Session roles over the Nest user document", () => {
    assert.deepEqual(accountRoles(["admin"], "teacher"), ["admin"]);
  });

  it("falls back to the Nest role when Session has none", () => {
    assert.deepEqual(accountRoles([], "teacher"), ["teacher"]);
    assert.deepEqual(accountRoles(undefined, "admin"), ["admin"]);
  });
});

describe("teacherNeedsOrganization", () => {
  it("is true only for a Teacher, not Admin or Organization", () => {
    assert.equal(teacherNeedsOrganization(["teacher"]), true);
    assert.equal(teacherNeedsOrganization(["admin"]), false);
    assert.equal(teacherNeedsOrganization(["organization"]), false);
    assert.equal(teacherNeedsOrganization(["student"]), false);
  });

  it("does not require a school when the Account is also Admin", () => {
    assert.equal(teacherNeedsOrganization(["admin", "teacher"]), false);
  });
});

describe("courseCatalogAccess", () => {
  const pendingTeacher = {
    teacherLoading: true,
    teacher: undefined,
    teacherError: undefined,
  };

  it("lets an Admin open Courses with no Teacher record and no Organization", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["admin"],
        teacherLoading: false,
        teacher: undefined,
        teacherError: new Error("Teacher not found"),
      }),
      "allow",
    );
  });

  it("blocks a Teacher who has no Teacher record", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["teacher"],
        teacherLoading: false,
        teacher: undefined,
        teacherError: new Error("Teacher not found"),
      }),
      "require-organization",
    );
  });

  it("blocks a Teacher whose record has no Organization", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["teacher"],
        teacherLoading: false,
        teacher: {},
        teacherError: undefined,
      }),
      "require-organization",
    );
  });

  it("lets a Teacher through when their record has an Organization", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["teacher"],
        teacherLoading: false,
        teacher: { organizationId: "6969d28cab0523f5ead4812d" },
        teacherError: undefined,
      }),
      "allow",
    );
  });

  it("waits while the Teacher lookup is in flight", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["teacher"],
        ...pendingTeacher,
      }),
      "pending",
    );
  });

  it("does not wait on Teacher lookup for Admin", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["admin"],
        ...pendingTeacher,
      }),
      "allow",
    );
  });

  it("lets an Organization Account through without a Teacher record", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["organization"],
        teacherLoading: false,
        teacher: undefined,
        teacherError: new Error("Teacher not found"),
      }),
      "allow",
    );
  });

  it("does not block a Teacher on a non-404 Teacher lookup failure", () => {
    assert.equal(
      courseCatalogAccess({
        roles: ["teacher"],
        teacherLoading: false,
        teacher: undefined,
        teacherError: new Error("Failed to load students: 500"),
      }),
      "allow",
    );
  });
});
