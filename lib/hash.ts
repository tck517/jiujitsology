/**
 * Incremental SHA-256 file hashing with constant memory usage.
 *
 * Uses a pure-JS SHA-256 implementation so we can call update() per chunk
 * instead of loading the entire file into a single ArrayBuffer (which OOMs
 * on multi-GB video files).
 *
 * The implementation follows FIPS 180-4 (SHA-256 specification).
 */

// SHA-256 constants: first 32 bits of the fractional parts of the cube roots
// of the first 64 primes.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

// Initial hash values: first 32 bits of fractional parts of square roots
// of the first 8 primes.
const INIT_H = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

export class Sha256 {
  private h = new Uint32Array(INIT_H);
  private buffer = new Uint8Array(64);
  private bufferLen = 0;
  private totalLen = 0;
  private w = new Uint32Array(64);

  update(data: Uint8Array): void {
    let offset = 0;
    this.totalLen += data.length;

    // If there's leftover data in the buffer, fill it first
    if (this.bufferLen > 0) {
      const needed = 64 - this.bufferLen;
      const toCopy = Math.min(needed, data.length);
      this.buffer.set(data.subarray(0, toCopy), this.bufferLen);
      this.bufferLen += toCopy;
      offset = toCopy;

      if (this.bufferLen === 64) {
        this.processBlock(this.buffer);
        this.bufferLen = 0;
      }
    }

    // Process full 64-byte blocks directly from input
    while (offset + 64 <= data.length) {
      this.processBlock(data.subarray(offset, offset + 64));
      offset += 64;
    }

    // Store remaining bytes in the buffer
    if (offset < data.length) {
      this.buffer.set(data.subarray(offset), 0);
      this.bufferLen = data.length - offset;
    }
  }

  digest(): string {
    // Capture total length before padding modifies it
    const totalBits = this.totalLen * 8;

    // Padding: append 1 bit, then zeros, then 64-bit big-endian length
    const padLen =
      this.bufferLen < 56 ? 56 - this.bufferLen : 120 - this.bufferLen;
    const padding = new Uint8Array(padLen + 8);
    padding[0] = 0x80;

    // Write total length in bits as 64-bit big-endian
    // JS bitwise ops are 32-bit, so we split
    const highBits = Math.floor(totalBits / 0x100000000);
    const lowBits = totalBits >>> 0;
    const view = new DataView(padding.buffer);
    view.setUint32(padLen, highBits, false);
    view.setUint32(padLen + 4, lowBits, false);

    // Feed padding directly to processBlock to avoid totalLen being modified
    let pOffset = 0;

    // Fill current buffer remainder
    if (this.bufferLen > 0) {
      const needed = 64 - this.bufferLen;
      const toCopy = Math.min(needed, padding.length);
      this.buffer.set(padding.subarray(0, toCopy), this.bufferLen);
      this.bufferLen += toCopy;
      pOffset = toCopy;

      if (this.bufferLen === 64) {
        this.processBlock(this.buffer);
        this.bufferLen = 0;
      }
    }

    // Process remaining full blocks from padding
    while (pOffset + 64 <= padding.length) {
      this.processBlock(padding.subarray(pOffset, pOffset + 64));
      pOffset += 64;
    }

    // Produce hex digest
    const result: string[] = [];
    for (let i = 0; i < 8; i++) {
      result.push(this.h[i].toString(16).padStart(8, "0"));
    }
    return result.join("");
  }

  private processBlock(block: Uint8Array): void {
    const w = this.w;

    // Prepare message schedule
    for (let i = 0; i < 16; i++) {
      const j = i * 4;
      w[i] =
        (block[j] << 24) |
        (block[j + 1] << 16) |
        (block[j + 2] << 8) |
        block[j + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    // Working variables
    let a = this.h[0];
    let b = this.h[1];
    let c = this.h[2];
    let d = this.h[3];
    let e = this.h[4];
    let f = this.h[5];
    let g = this.h[6];
    let h = this.h[7];

    // Compression
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    this.h[0] = (this.h[0] + a) | 0;
    this.h[1] = (this.h[1] + b) | 0;
    this.h[2] = (this.h[2] + c) | 0;
    this.h[3] = (this.h[3] + d) | 0;
    this.h[4] = (this.h[4] + e) | 0;
    this.h[5] = (this.h[5] + f) | 0;
    this.h[6] = (this.h[6] + g) | 0;
    this.h[7] = (this.h[7] + h) | 0;
  }
}

/**
 * Compute SHA-256 hash of a File using constant memory.
 * Reads the file in 2MB chunks and feeds each to an incremental hasher,
 * so only one chunk is in memory at a time.
 */
export async function hashFile(file: File): Promise<string> {
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
  const hasher = new Sha256();
  let offset = 0;

  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await new Response(slice).arrayBuffer();
    hasher.update(new Uint8Array(buffer));
    offset += CHUNK_SIZE;
  }

  return hasher.digest();
}
