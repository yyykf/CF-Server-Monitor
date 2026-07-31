const encoder = new TextEncoder();

async function sha256(value) {
  return crypto.subtle.digest('SHA-256', encoder.encode(String(value ?? '')));
}

export async function secureCompare(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || expected.length === 0) {
    return false;
  }

  const [providedHash, expectedHash] = await Promise.all([
    sha256(provided),
    sha256(expected)
  ]);

  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
  }

  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}
