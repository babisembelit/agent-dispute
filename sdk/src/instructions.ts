import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { AGENT_DISPUTE_PROGRAM_ID, deriveEscrowPda, deriveVaultPda, deriveDisputePda, deriveEvidencePda, deriveReputationPda } from './accounts';

export class AgentDisputeInstruction {
  static createEscrow(
    agentA: PublicKey,
    agentB: PublicKey,
    amount: number,
    taskHash: Uint8Array,
    criteriaHash: Uint8Array,
    deadline: number,
    nonce: number,
    programId = AGENT_DISPUTE_PROGRAM_ID
  ): TransactionInstruction {
    const [escrowPda] = deriveEscrowPda(agentA, agentB, nonce, programId);
    const [vaultPda] = deriveVaultPda(escrowPda, programId);

    // Data layout: [0 (1), amount (8), taskHash (32), criteriaHash (32), deadline (8), nonce (8)]
    const data = Buffer.alloc(1 + 8 + 32 + 32 + 8 + 8);
    data.writeUInt8(0, 0); // Instruction enum = 0
    data.writeBigUInt64LE(BigInt(amount), 1);
    data.set(taskHash, 9);
    data.set(criteriaHash, 41);
    data.writeBigInt64LE(BigInt(deadline), 73);
    data.writeBigUInt64LE(BigInt(nonce), 81);

    return new TransactionInstruction({
      programId,
      keys: [
        { pubkey: agentA, isSigner: true, isWritable: true },
        { pubkey: agentB, isSigner: false, isWritable: false },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  static deliverWork(
    agentB: PublicKey,
    escrowPda: PublicKey,
    evidenceHash: Uint8Array,
    programId = AGENT_DISPUTE_PROGRAM_ID
  ): TransactionInstruction {
    // Data layout: [1 (1), evidenceHash (32)]
    const data = Buffer.alloc(1 + 32);
    data.writeUInt8(1, 0); // Instruction enum = 1
    data.set(evidenceHash, 1);

    return new TransactionInstruction({
      programId,
      keys: [
        { pubkey: agentB, isSigner: true, isWritable: false },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
      ],
      data,
    });
  }

  static approvePayment(
    agentA: PublicKey,
    escrowPda: PublicKey,
    vaultPda: PublicKey,
    agentB: PublicKey,
    reputationB: PublicKey,
    programId = AGENT_DISPUTE_PROGRAM_ID
  ): TransactionInstruction {
    // Data layout: [2 (1)]
    const data = Buffer.alloc(1);
    data.writeUInt8(2, 0);

    return new TransactionInstruction({
      programId,
      keys: [
        { pubkey: agentA, isSigner: true, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: agentB, isSigner: false, isWritable: true },
        { pubkey: reputationB, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  static fileDispute(
    payer: PublicKey,
    escrowPda: PublicKey,
    claimHash: Uint8Array,
    bondAmount: number,
    programId = AGENT_DISPUTE_PROGRAM_ID
  ): TransactionInstruction {
    const [disputePda] = deriveDisputePda(escrowPda, programId);
    const [vaultPda] = deriveVaultPda(escrowPda, programId);
    
    // Data layout: [3 (1), claimHash (32), bondAmount (8)]
    const data = Buffer.alloc(1 + 32 + 8);
    data.writeUInt8(3, 0);
    data.set(claimHash, 1);
    data.writeBigUInt64LE(BigInt(bondAmount), 33);

    return new TransactionInstruction({
      programId,
      keys: [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: disputePda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  static submitEvidence(
    submitter: PublicKey,
    escrowPda: PublicKey,
    evidenceType: number,
    contentHash: Uint8Array,
    index: number,
    programId = AGENT_DISPUTE_PROGRAM_ID
  ): TransactionInstruction {
    const [evidencePda] = deriveEvidencePda(escrowPda, submitter, index, programId);
    
    // Data layout: [4 (1), type (1), hash (32), index (4)]
    const data = Buffer.alloc(1 + 1 + 32 + 4);
    data.writeUInt8(4, 0);
    data.writeUInt8(evidenceType, 1);
    data.set(contentHash, 2);
    data.writeUInt32LE(index, 34);

    return new TransactionInstruction({
      programId,
      keys: [
        { pubkey: submitter, isSigner: true, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: false },
        { pubkey: evidencePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  static submitArbiterVote(
    arbiter: PublicKey,
    escrowPda: PublicKey,
    disputePda: PublicKey,
    winner: number,
    confidence: number,
    reasoningHash: Uint8Array,
    programId = AGENT_DISPUTE_PROGRAM_ID
  ): TransactionInstruction {
    // Data layout: [5 (1), winner (1), confidence (1), reasoningHash (32)]
    const data = Buffer.alloc(1 + 1 + 1 + 32);
    data.writeUInt8(5, 0);
    data.writeUInt8(winner, 1);
    data.writeUInt8(confidence, 2);
    data.set(reasoningHash, 3);

    return new TransactionInstruction({
      programId,
      keys: [
        { pubkey: arbiter, isSigner: true, isWritable: true },
        { pubkey: disputePda, isSigner: false, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  static executeVerdict(
    executor: PublicKey,
    escrowPda: PublicKey,
    disputePda: PublicKey,
    vaultPda: PublicKey,
    agentA: PublicKey,
    agentB: PublicKey,
    reputationA: PublicKey,
    reputationB: PublicKey,
    programId = AGENT_DISPUTE_PROGRAM_ID
  ): TransactionInstruction {
    // Data layout: [6 (1)]
    const data = Buffer.alloc(1);
    data.writeUInt8(6, 0);

    return new TransactionInstruction({
      programId,
      keys: [
        { pubkey: executor, isSigner: true, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: disputePda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: agentA, isSigner: false, isWritable: true },
        { pubkey: agentB, isSigner: false, isWritable: true },
        { pubkey: reputationA, isSigner: false, isWritable: true },
        { pubkey: reputationB, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }
}
