import { PublicKey } from '@solana/web3.js';

export enum EscrowStatus {
  Pending = 0,
  Delivered = 1,
  Disputed = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface EscrowAccount {
  isInitialized: boolean;
  agentA: PublicKey;
  agentB: PublicKey;
  amount: bigint;
  taskHash: Uint8Array;
  criteriaHash: Uint8Array;
  deliveryDeadline: bigint;
  disputeWindow: bigint;
  status: EscrowStatus;
  createdAt: bigint;
  deliveredAt: bigint;
  disputeKey: PublicKey;
  nonce: bigint;
  bump: number;
}
