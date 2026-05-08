import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AgentDisputeInstruction, deriveEscrowPda, deriveVaultPda } from 'agent-dispute-sdk';

async function main() {
    console.log("🚀 Starting Agent Dispute Happy Path Demo\n");

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // Replace with the actual deployed program ID
    const programId = new PublicKey("courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF");

    // Initialize mock agents
    const payer = Keypair.generate();
    const agentA = Keypair.generate();
    const agentB = Keypair.generate();
    const arbiter = Keypair.generate();

    console.log(`Payer (Client): ${payer.publicKey.toBase58()}`);
    console.log(`Agent A (Hirer): ${agentA.publicKey.toBase58()}`);
    console.log(`Agent B (Worker): ${agentB.publicKey.toBase58()}`);

    try {
        // Airdrop SOL to payer
        console.log("\n1. Airdropping SOL to payer...");
        try {
            const airdropSig = await connection.requestAirdrop(payer.publicKey, 0.1 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(airdropSig);
            console.log("✅ Airdrop complete.");
        } catch (airdropErr) {
            console.log("⚠️ Airdrop failed (rate limit). Please fund this address manually:");
            console.log(`solana airdrop 0.1 ${payer.publicKey.toBase58()} --url devnet`);
            return;
        }        console.log("✅ Airdrop complete.");

        // Define task parameters
        const amount = 1_000_000_000; // 1 SOL
        const nonce = Math.floor(Math.random() * 1000000);
        const taskHash = new Uint8Array(32).fill(1);
        const criteriaHash = new Uint8Array(32).fill(2);

        const [escrowPda] = deriveEscrowPda(agentA.publicKey, agentB.publicKey, nonce, programId);
        const [vaultPda] = deriveVaultPda(escrowPda, programId);
        
        console.log(`\nEscrow PDA: ${escrowPda.toBase58()}`);
        console.log(`Vault PDA: ${vaultPda.toBase58()}`);

        const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

        // Step 1: Create Escrow
        console.log("\n2. Agent A creating Escrow and locking 1 SOL...");
        const createEscrowIx = AgentDisputeInstruction.createEscrow(
            agentA.publicKey,
            agentB.publicKey,
            amount,
            taskHash,
            criteriaHash,
            deadline,
            nonce,
            programId
        );

        let tx = new Transaction().add(createEscrowIx);
        let sig = await sendAndConfirmTransaction(connection, tx, [payer, agentA]);
        console.log(`✅ Escrow Created! Signature: ${sig}`);

        // Note: For a fully functional demo against a local validator, we'd need to mock the
        // deliver_work and approve_payment instructions in the SDK as well. 
        // For now, this demonstrates the end-to-end scaffolding of the SDK wrapping the Rust instructions.
        console.log("\n🎉 Happy Path Demo Scaffolding Complete!");

    } catch (e) {
        console.error("❌ Error running demo:", e);
    }
}

main();
