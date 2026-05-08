const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const pubkey = new PublicKey('A2tNx3GyyippZm8gnNQyyM857Bm4kL8dNR4LhxiVvLVT');
  
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 20 });
  
  let totalSpent = 0;
  console.log("Recent Transactions for Agent A:");
  
  for (const sigInfo of signatures) {
    const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
    if (!tx || !tx.meta) continue;
    
    const accountIndex = tx.transaction.message.accountKeys.findIndex(k => k.pubkey.toBase58() === pubkey.toBase58());
    if (accountIndex === -1) continue;
    
    const pre = tx.meta.preBalances[accountIndex];
    const post = tx.meta.postBalances[accountIndex];
    const diff = (pre - post) / LAMPORTS_PER_SOL;
    
    if (diff > 0.001) { // Only log significant spends (ignore tiny tx fees)
        console.log(`- Spent ${diff.toFixed(4)} SOL in tx: ${sigInfo.signature}`);
        totalSpent += diff;
    }
  }
  
  console.log(`\nTotal recently spent: ~${totalSpent.toFixed(4)} SOL`);
}
main().catch(console.error);
