function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(value: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

export async function sha256Hex(value: string): Promise<string> {
  return toHex(await sha256Bytes(value));
}

/**
 * Length-independent comparison via SHA-256 then XOR fold.
 */
export async function timingSafeEqualString(
  a: string,
  b: string
): Promise<boolean> {
  const ha = await sha256Bytes(a);
  const hb = await sha256Bytes(b);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) {
    diff |= ha[i] ^ hb[i];
  }
  return diff === 0;
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}
