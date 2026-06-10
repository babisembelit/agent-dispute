/**
 * register_arbiter.ts
 * Sends a RegisterArbiter instruction (index 8) to whitelist the arbiter keypair.
 *
 * Accounts:
 *   0. admin          [signer, writable]  — deployer keypair
 *   1. arbiter        []                  — arbiter pubkey to whitelist
 *   2. registry_pda   [writable]          — PDA: ["arbiter_registry", arbiter]
 *   3. system_program []
 *
 * Instruction data layout:
 *   [0]      u8       — instruction index (8)
 *   [1..33]  [u8;32]  — admin pubkey
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID   = new PublicKey('courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF');
const RPC_URL      = 'https://devnet.helius-rpc.com/?api-key=24e740ef-acbc-4d98-9e8f-0db04a1262cb';

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  const connection  = new Connection(RPC_URL, 'confirmed');
  const admin       = loadKeypair('/Users/badaiwinata/.config/solana/id.json');
  const arbiterKp   = loadKeypair('/Users/badaiwinata/agent-dispute/keys/arbiter.json');

  console.log('Admin:   ', admin.publicKey.toBase58());
  console.log('Arbiter: ', arbiterKp.publicKey.toBase58());

  // Derive arbiter_registry PDA
  const [registryPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('arbiter_registry'), arbiterKp.publicKey.toBuffer()],
    PROGRAM_ID,
  );
  console.log('Registry PDA:', registryPda.toBase58(), '(bump:', bump, ')');

  // Build instruction data: [8] + admin pubkey bytes
  const data = Buffer.alloc(33);
  data.writeUInt8(8, 0);
  admin.publicKey.toBuffer().copy(data, 1);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: admin.publicKey,          isSigner: true,  isWritable: true  },
      { pubkey: arbiterKp.publicKey,      isSigner: false, isWritable: false },
      { pubkey: registryPda,              isSigner: false, isWritable: true  },
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction().add(ix);
  console.log('\nSending RegisterArbiter transaction...');

  const sig = await sendAndConfirmTransaction(connection, tx, [admin], {
    commitment: 'confirmed',
  });

  console.log('✅ Arbiter registered!');
  console.log('   Tx:', sig);
  console.log('   Solscan: https://solscan.io/tx/' + sig + '?cluster=devnet');
}

main().catch(err => {
  console.error('❌ Error:', err.message ?? err);
  process.exit(1);
});
