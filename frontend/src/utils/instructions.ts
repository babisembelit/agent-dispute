import { PublicKey } from '@solana/web3.js';

export function derivePDA(seeds: (Buffer | Uint8Array)[], programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

export async function sha256(text: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded.buffer as ArrayBuffer);
  return new Uint8Array(hashBuffer);
}

export function u64ToLeBytes(n: number): Uint8Array {
  const buf = new Uint8Array(8);
  let v = BigInt(n);
  for (let i = 0; i < 8; i++) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

/** Solscan devnet URL for an account or transaction */
export function solscanUrl(pubkeyOrSig: string, type: 'account' | 'tx' = 'account'): string {
  return `https://solscan.io/${type}/${pubkeyOrSig}?cluster=devnet`;
}

/** Convert 32-byte hash to a shortened hex display string e.g. "a1b2c3…f4e5" */
export function shortHash(bytes: Uint8Array): string {
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 6) + '…' + hex.slice(-4);
}

/** Build a Pinata gateway URL from 32 raw SHA-256 bytes */
export function pinataUrl(bytes: Uint8Array): string {
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `https://gateway.pinata.cloud/ipfs/${hex}`;
}
