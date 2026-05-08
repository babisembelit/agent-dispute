import { Connection, PublicKey } from '@solana/web3.js';
import { getEscrowAccount } from '../../sdk/src/accounts';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const escrowPda = new PublicKey('FXfzX8FW9deN18kVF5a3DNt4NL1UUZjZFD1pKX8qFrkp');
  
  console.log('Verifying Escrow status for:', escrowPda.toBase58());
  const escrow = await getEscrowAccount(connection, escrowPda);
  
  if (escrow) {
    console.log('Escrow found!');
    console.log('Status:', escrow.status); // Should be 2 (Disputed)
    console.log('Amount:', escrow.amount.toString());
    console.log('Agent A:', escrow.agentA.toBase58());
    console.log('Agent B:', escrow.agentB.toBase58());
  } else {
    console.log('Escrow not found.');
  }
}

main().catch(console.error);
