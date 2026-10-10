import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ObjectId, Types } from "./object-id.ts";

describe("ObjectId", () => {
  it("generates a 24-hex id without mongoose", () => {
    const id = new Types.ObjectId();
    assert.equal(id.toString().length, 24);
    assert.match(id.toHexString(), /^[a-f0-9]{24}$/);
    assert.equal(id instanceof Types.ObjectId, true);
    assert.equal(id instanceof ObjectId, true);
  });

  it("keeps a valid id and rejects a bad one", () => {
    const id = new ObjectId("507f1f77bcf86cd799439011");
    assert.equal(id.toString(), "507f1f77bcf86cd799439011");
    assert.throws(() => new ObjectId("not-an-id"));
  });
});
