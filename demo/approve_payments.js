const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } = require('@solana/web3.js');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const programId = new PublicKey('Ewe2wuvJVRVnxqSmkdfHvBCeuZj98jxCDzeL78v4LtFu');
  
  const agentA = Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync('../keys/agent_a.json'))));
  const agentB = Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync('../keys/agent_b.json')))).publicKey;
  
  // Find escrows
  const escrows = await connection.getProgramAccounts(programId, {
    filters: [{ dataSize: 211 }]
  });
  
  console.log(`Found ${escrows.length} total escrows. Filtering for "Delivered" state...`);
  
  for (const escrow of escrows) {
      const statusByte = escrow.account.data.readUInt8(153);
      console.log(`Escrow ${escrow.pubkey.toBase58()} status: ${statusByte}`);
      if (statusByte === 1) { // 1 = Delivered
          console.log(`Approving payment for Escrow: ${escrow.pubkey.toBase58()}`);
          
          const escrowPda = escrow.pubkey;
          const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault'), escrowPda.toBuffer()], programId);
          const [reputationB] = PublicKey.findProgramAddressSync([Buffer.from('reputation'), agentB.toBuffer()], programId);
          
          const data = Buffer.alloc(1);
          data.writeUInt8(2, 0); // Instruction 2 = ApprovePayment
          
          const approveIx = new TransactionInstruction({
              programId,
              keys: [
                  { pubkey: agentA.publicKey, isSigner: true, isWritable: true },
                  { pubkey: escrowPda, isSigner: false, isWritable: true },
                  { pubkey: vaultPda, isSigner: false, isWritable: true },
                  { pubkey: agentB, isSigner: false, isWritable: true },
                  { pubkey: reputationB, isSigner: false, isWritable: true },
                  { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
              ],
              data,
          });
          
          const tx = new Transaction().add(approveIx);
          tx.feePayer = agentA.publicKey;
          
          try {
              const sig = await sendAndConfirmTransaction(connection, tx, [agentA]);
              console.log(`Payment Approved! Signature: ${sig}`);
          } catch (e) {
              console.error(`Failed to approve payment: ${e.message}`);
          }
      }
  }
}
main().catch(console.error);
