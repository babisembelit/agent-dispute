import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { AgentDisputeInstruction } from '../sdk/src/instructions';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const programId = new PublicKey('Ewe2wuvJVRVnxqSmkdfHvBCeuZj98jxCDzeL78v4LtFu');
  
  // Need Agent A to pay fees
  const feePayer = Keypair.fromSecretKey(new Uint8Array(require('fs').readFileSync('../keys/agent_a.json')));
  
  // Get the most recent dispute PDA
  const disputes = await connection.getProgramAccounts(programId, {
    filters: [{ dataSize: 249 }] // DisputeAccount length
  });
  
  if (disputes.length === 0) {
    console.log("No disputes found.");
    return;
  }
  
  // Sort by filed_at (approx byte offset 220) to get newest
  const latestDispute = disputes.sort((a, b) => {
    const aTime = a.account.data.readBigInt64LE(220);
    const bTime = b.account.data.readBigInt64LE(220);
    return Number(bTime - aTime);
  })[0];
  
  const disputePda = latestDispute.pubkey;
  // Escrow is at offset 1 to 33
  const escrowPda = new PublicKey(latestDispute.account.data.subarray(1, 33));
  
  console.log(`Finalizing Dispute: ${disputePda.toBase58()}`);
  
  // Vote 2 times with random keypairs to reach 3 votes
  for (let i = 0; i < 2; i++) {
    const arbiter = Keypair.generate();
    
    const voteIx = AgentDisputeInstruction.submitArbiterVote(
      arbiter.publicKey,
      escrowPda,
      disputePda,
      2, // Winner: Agent B
      100, // Confidence
      new Uint8Array(32).fill(5), // Reasoning hash
      programId
    );
    
    const tx = new Transaction().add(voteIx);
    tx.feePayer = feePayer.publicKey;
    
    try {
        const sig = await sendAndConfirmTransaction(connection, tx, [feePayer, arbiter]);
        console.log(`Vote ${i+1} submitted: ${sig}`);
    } catch (e) {
        console.error(`Vote ${i+1} failed: ${e.message}`);
    }
  }
}
main().catch(console.error);
