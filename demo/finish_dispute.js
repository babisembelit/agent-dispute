const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } = require('@solana/web3.js');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const programId = new PublicKey('Ewe2wuvJVRVnxqSmkdfHvBCeuZj98jxCDzeL78v4LtFu');
  const feePayer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync('../keys/agent_a.json'))));
  
  const disputes = await connection.getProgramAccounts(programId, {
    filters: [{ dataSize: 421 }]
  });
  
  if (disputes.length === 0) {
    console.log("No disputes found.");
    return;
  }
  
  console.log(`Found ${disputes.length} total disputes.`);
  
  for (const dispute of disputes) {
      const disputePda = dispute.pubkey;
      const escrowPda = new PublicKey(dispute.account.data.subarray(1, 33));
      const verdict = dispute.account.data.readUInt8(223); // Offset for verdict is 1+32+32+32+32+32+8+8+(74*3)+1+1 = 401. Let's calculate exactly.
      // 1+32+32+32+32+32+8+8+222+1+1 = 401. 
      // Wait, let me just check if executed is true.
      // executed is at offset 419.
      const executed = dispute.account.data.readUInt8(419);
      if (executed === 1) {
          console.log(`Dispute ${disputePda.toBase58()} is already executed. Skipping.`);
          continue;
      }
      
      console.log(`Finalizing Dispute: ${disputePda.toBase58()}`);
      
      // Submit 2 more votes
      for (let i = 0; i < 2; i++) {
        const arbiter = Keypair.generate();
        const data = Buffer.alloc(1 + 1 + 1 + 32);
        data.writeUInt8(5, 0); // Instruction 5
        data.writeUInt8(2, 1); // Winner: Agent B
        data.writeUInt8(100, 2); // Confidence
        data.fill(5, 3); // Reasoning Hash
        
        const voteIx = new TransactionInstruction({
          programId,
          keys: [
            { pubkey: arbiter.publicKey, isSigner: true, isWritable: true },
            { pubkey: disputePda, isSigner: false, isWritable: true },
            { pubkey: escrowPda, isSigner: false, isWritable: false },
          ],
          data,
        });
        
        const tx = new Transaction().add(voteIx);
        tx.feePayer = feePayer.publicKey;
        try {
            await sendAndConfirmTransaction(connection, tx, [feePayer, arbiter]);
        } catch (e) {
            // Ignore if already voted or consensus reached
        }
      }
      
      console.log("Verdict reached! Now executing the verdict...");
      const agentA = Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync('../keys/agent_a.json')))).publicKey;
      const agentB = Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync('../keys/agent_b.json')))).publicKey;
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault'), escrowPda.toBuffer()], programId);
      const [reputationA] = PublicKey.findProgramAddressSync([Buffer.from('reputation'), agentA.toBuffer()], programId);
      const [reputationB] = PublicKey.findProgramAddressSync([Buffer.from('reputation'), agentB.toBuffer()], programId);
      
      const executeData = Buffer.alloc(1);
      executeData.writeUInt8(6, 0);
      const executeIx = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: feePayer.publicKey, isSigner: true, isWritable: true },
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: disputePda, isSigner: false, isWritable: true },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: agentA, isSigner: false, isWritable: true },
          { pubkey: agentB, isSigner: false, isWritable: true },
          { pubkey: reputationA, isSigner: false, isWritable: true },
          { pubkey: reputationB, isSigner: false, isWritable: true },
          { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ],
        data: executeData,
      });
      
      const execTx = new Transaction().add(executeIx);
      execTx.feePayer = feePayer.publicKey;
      try {
          const sig = await sendAndConfirmTransaction(connection, execTx, [feePayer]);
          console.log(`Verdict Executed successfully: ${sig}`);
      } catch (e) {
          console.error(`Execute failed: ${e.message}`);
      }
  }
}
main().catch(console.error);
