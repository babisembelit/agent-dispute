const { Connection, PublicKey } = require('@solana/web3.js');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const programId = new PublicKey('Ewe2wuvJVRVnxqSmkdfHvBCeuZj98jxCDzeL78v4LtFu');
  
  // EscrowAccount is 211 bytes
  const escrows = await connection.getProgramAccounts(programId, {
    filters: [{ dataSize: 211 }]
  });
  
  console.log(`Total Escrows found: ${escrows.length}`);
  
  const statuses = {
    0: 'Pending',
    1: 'Delivered',
    2: 'Disputed',
    3: 'Completed',
    4: 'Cancelled'
  };
  
  const statusCounts = {0:0, 1:0, 2:0, 3:0, 4:0};
  
  for (const escrow of escrows) {
      // status is at offset 1 + 32 + 32 + 8 + 32 + 32 + 8 + 8 = 153
      const statusByte = escrow.account.data.readUInt8(153);
      statusCounts[statusByte]++;
  }
  
  for (const [key, val] of Object.entries(statusCounts)) {
      if (val > 0) {
          console.log(`- ${val} Escrow(s) in status: ${statuses[key]}`);
      }
  }
}
main().catch(console.error);
