import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import * as fs from 'fs';
import { AgentDisputeInstruction } from '../../sdk/src/instructions';
import { AGENT_DISPUTE_PROGRAM_ID, deriveEscrowPda, deriveVaultPda, deriveDisputePda, deriveReputationPda } from '../../sdk/src/accounts';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load persistent keys
  const loadKey = (path: string) => Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path, 'utf-8'))));
  
  const deployer = loadKey('/Users/badaiwinata/agent-dispute/target/deploy/agent_dispute-keypair.json'); // Just to have a payer
  const agentA = loadKey('/Users/badaiwinata/agent-dispute/keys/agent_a.json');
  const agentB = loadKey('/Users/badaiwinata/agent-dispute/keys/agent_b.json');
  const arbiter = loadKey('/Users/badaiwinata/agent-dispute/keys/arbiter.json');
  
  console.log('--- Agent Dispute Protocol: Devnet Demo ---');
  console.log('Program ID:', AGENT_DISPUTE_PROGRAM_ID.toBase58());
  console.log('Agent A (Hirer):', agentA.publicKey.toBase58());
  console.log('Agent B (Worker):', agentB.publicKey.toBase58());
  console.log('Arbiter:', arbiter.publicKey.toBase58());

  const nonce = Math.floor(Math.random() * 1000000);
  const amount = Math.floor(0.01111111111111 * LAMPORTS_PER_SOL);
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  const [escrowPda] = deriveEscrowPda(agentA.publicKey, agentB.publicKey, nonce);
  const [vaultPda] = deriveVaultPda(escrowPda);
  const [reputationB] = deriveReputationPda(agentB.publicKey);

  console.log('\n1. Creating Escrow...');
  const createIx = AgentDisputeInstruction.createEscrow(
    agentA.publicKey,
    agentB.publicKey,
    amount,
    new Uint8Array(32).fill(1), // task hash
    new Uint8Array(32).fill(2), // criteria hash
    deadline,
    nonce
  );

  let tx = new Transaction().add(createIx);
  let sig = await sendAndConfirmTransaction(connection, tx, [agentA]);
  console.log('Escrow Created! Sig:', sig);
  console.log('Escrow PDA:', escrowPda.toBase58());

  console.log('\n2. Agent B Delivering Work...');
  const deliverIx = AgentDisputeInstruction.deliverWork(
    agentB.publicKey,
    escrowPda,
    new Uint8Array(32).fill(3) // evidence hash
  );
  tx = new Transaction().add(deliverIx);
  sig = await sendAndConfirmTransaction(connection, tx, [agentB]);
  console.log('Work Delivered! Sig:', sig);

  console.log('\n3. Agent A Filing Dispute (Simulation)...');
  const fileIx = AgentDisputeInstruction.fileDispute(
    agentA.publicKey,
    escrowPda,
    new Uint8Array(32).fill(4), // claim hash
    0 // bond
  );
  tx = new Transaction().add(fileIx);
  sig = await sendAndConfirmTransaction(connection, tx, [agentA]);
  console.log('Dispute Filed! Sig:', sig);

  console.log('\n--- Demo Phase 1 Complete ---');
  console.log('The AI Arbiter service will now pick up the dispute and vote.');
}

main().catch(console.error);
