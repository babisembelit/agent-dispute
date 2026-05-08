const { Connection, PublicKey } = require('@solana/web3.js');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const pubkey = new PublicKey('2HVvEmbqqK8Sxn4UMJm7m1cdKNQ4C4PEciKFJZPdy2KT'); // Arbiter
  
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1 });
  
  if (signatures.length === 0) {
    console.log("No transactions found for Arbiter.");
    return;
  }
  
  console.log(`Latest Arbiter tx: ${signatures[0].signature}`);
  console.log(`Status: ${signatures[0].err ? 'Failed' : 'Success'}`);
  if (signatures[0].err) {
    console.log(`Error details: ${JSON.stringify(signatures[0].err)}`);
  }
}
main().catch(console.error);
