/**
 * Client-safe stand-in for `mongoose.Types.ObjectId`.
 * The dashboard only needs 24-hex ids. Importing mongoose pulled the driver
 * into every page's browser bundle.
 */

const HEX_24 = /^[a-f0-9]{24}$/i;

function randomObjectIdHex(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export class ObjectId {
  private readonly hex: string;

  constructor(id?: string | ObjectId | null) {
    if (id instanceof ObjectId) {
      this.hex = id.hex;
      return;
    }
    if (id == null || id === "") {
      this.hex = randomObjectIdHex();
      return;
    }
    const raw = String(id).trim();
    if (!HEX_24.test(raw)) {
      throw new Error(`Invalid ObjectId: ${raw}`);
    }
    this.hex = raw.toLowerCase();
  }

  toString(): string {
    return this.hex;
  }

  toHexString(): string {
    return this.hex;
  }

  toJSON(): string {
    return this.hex;
  }
}

/** Same shape call sites used with mongoose: `Types.ObjectId`. */
export const Types = { ObjectId };
