const fs = require('fs');

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = BigInt(58);

function toBase58(buffer) {
  if (buffer.length === 0) return '';
  let i = 0;
  while (i < buffer.length && buffer[i] === 0) {
    i++;
  }
  let x = BigInt(0);
  for (let j = i; j < buffer.length; j++) {
    x = x * BigInt(256) + BigInt(buffer[j]);
  }
  let str = '';
  while (x > BigInt(0)) {
    const rem = Number(x % BASE);
    x = x / BASE;
    str = ALPHABET[rem] + str;
  }
  for (let j = 0; j < i; j++) {
    str = ALPHABET[0] + str;
  }
  return str;
}

const paths = {
  'Deployer / Program': '/Users/badaiwinata/agent-dispute/target/deploy/agent_dispute-keypair.json',
  'Agent A (Hirer)': '/Users/badaiwinata/agent-dispute/keys/agent_a.json',
  'Agent B (Worker)': '/Users/badaiwinata/agent-dispute/keys/agent_b.json',
  'AI Arbiter': '/Users/badaiwinata/agent-dispute/keys/arbiter.json'
};

console.log("Current Wallet Addresses:\n=========================");
for (const [name, path] of Object.entries(paths)) {
  if (fs.existsSync(path)) {
    const secret = new Uint8Array(JSON.parse(fs.readFileSync(path, 'utf8')));
    // The public key is the last 32 bytes of the 64-byte secret key pair
    const pubkey = secret.slice(32, 64);
    console.log(`${name}: ${toBase58(pubkey)}`);
  } else {
    console.log(`${name}: [File not found]`);
  }
}
