import { PublicKey, Connection } from '@solana/web3.js';
import { EscrowAccount, EscrowStatus } from './types';

export const AGENT_DISPUTE_PROGRAM_ID = new PublicKey(
  'courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF'
);

/**
 * Derives the Escrow PDA.
 */
export function deriveEscrowPda(
  agentA: PublicKey,
  agentB: PublicKey,
  nonce: number,
  programId: PublicKey = AGENT_DISPUTE_PROGRAM_ID
): [PublicKey, number] {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64LE(BigInt(nonce));

  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), agentA.toBuffer(), agentB.toBuffer(), nonceBuffer],
    programId
  );
}

/**
 * Derives the Vault PDA.
 */
export function deriveVaultPda(
  escrow: PublicKey,
  programId: PublicKey = AGENT_DISPUTE_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), escrow.toBuffer()],
    programId
  );
}

/**
 * Derives the Dispute PDA.
 */
export function deriveDisputePda(
  escrow: PublicKey,
  programId: PublicKey = AGENT_DISPUTE_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dispute'), escrow.toBuffer()],
    programId
  );
}

/**
 * Derives the Evidence PDA.
 */
export function deriveEvidencePda(
  escrow: PublicKey,
  submitter: PublicKey,
  index: number,
  programId: PublicKey = AGENT_DISPUTE_PROGRAM_ID
): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32LE(index);

  return PublicKey.findProgramAddressSync(
    [Buffer.from('evidence'), escrow.toBuffer(), submitter.toBuffer(), indexBuffer],
    programId
  );
}

/**
 * Derives the Reputation PDA.
 */
export function deriveReputationPda(
  agent: PublicKey,
  programId: PublicKey = AGENT_DISPUTE_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('reputation'), agent.toBuffer()],
    programId
  );
}

/**
 * Fetches and deserializes an EscrowAccount from the blockchain.
 */
export async function getEscrowAccount(
  connection: Connection,
  escrowPda: PublicKey
): Promise<EscrowAccount | null> {
  const accountInfo = await connection.getAccountInfo(escrowPda);
  if (!accountInfo) return null;

  const data = accountInfo.data;
  let offset = 0;

  const isInitialized = data[offset] === 1;
  offset += 1;

  const agentA = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const agentB = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const amount = data.readBigUInt64LE(offset);
  offset += 8;

  const taskHash = new Uint8Array(data.subarray(offset, offset + 32));
  offset += 32;

  const criteriaHash = new Uint8Array(data.subarray(offset, offset + 32));
  offset += 32;

  const deliveryDeadline = data.readBigInt64LE(offset);
  offset += 8;

  const disputeWindow = data.readBigInt64LE(offset);
  offset += 8;

  const status = data[offset] as EscrowStatus;
  offset += 1;

  const createdAt = data.readBigInt64LE(offset);
  offset += 8;

  const deliveredAt = data.readBigInt64LE(offset);
  offset += 8;

  const disputeKey = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const nonce = data.readBigUInt64LE(offset);
  offset += 8;

  const bump = data[offset];
  offset += 1;

  return {
    isInitialized,
    agentA,
    agentB,
    amount,
    taskHash,
    criteriaHash,
    deliveryDeadline,
    disputeWindow,
    status,
    createdAt,
    deliveredAt,
    disputeKey,
    nonce,
    bump
  };
}
