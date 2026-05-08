const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const wallets = {
  'Agent A (Hirer)': 'A2tNx3GyyippZm8gnNQyyM857Bm4kL8dNR4LhxiVvLVT',
  'Agent B (Worker)': 'Dv17ic6NYTvpfpFdWZ1ASpeBiWDwP9TyDa52KWJQPJiS',
  'AI Arbiter': '2HVvEmbqqK8Sxn4UMJm7m1cdKNQ4C4PEciKFJZPdy2KT'
};

async function checkBalances() {
  console.log("Checking Devnet Balances:\\n=========================");
  for (const [name, address] of Object.entries(wallets)) {
    try {
      const balance = await connection.getBalance(new PublicKey(address));
      console.log(`${name}: ${balance / LAMPORTS_PER_SOL} SOL`);
    } catch (e) {
      console.log(`${name}: Failed to fetch (${e.message})`);
    }
  }
}

checkBalances();
