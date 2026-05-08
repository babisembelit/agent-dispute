const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const pubkey = new PublicKey('A2tNx3GyyippZm8gnNQyyM857Bm4kL8dNR4LhxiVvLVT');
  
  // Get transaction signatures for the address
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });
  
  if (signatures.length === 0) {
    console.log("No transactions found.");
    return;
  }
  
  // The last signature in the array is the oldest (first) transaction
  const firstSig = signatures[signatures.length - 1].signature;
  
  // Fetch the parsed transaction details
  const tx = await connection.getParsedTransaction(firstSig, { maxSupportedTransactionVersion: 0 });
  
  if (tx && tx.meta) {
    const preBalance = tx.meta.preBalances[0]; // roughly the fee payer or main account
    const postBalance = tx.meta.postBalances[0];
    
    // Find the account index for Agent A
    const accountIndex = tx.transaction.message.accountKeys.findIndex(k => k.pubkey.toBase58() === pubkey.toBase58());
    
    if (accountIndex !== -1) {
       const pre = tx.meta.preBalances[accountIndex];
       const post = tx.meta.postBalances[accountIndex];
       const deposit = (post - pre) / LAMPORTS_PER_SOL;
       console.log(`First deposit to Agent A: ${deposit} SOL`);
       console.log(`Transaction Signature: ${firstSig}`);
    } else {
       console.log("Agent A not found in the first transaction.");
    }
  }
}
main().catch(console.error);
