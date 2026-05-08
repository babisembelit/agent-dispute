import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AgentDisputeInstruction, deriveEscrowPda, deriveDisputePda, deriveVaultPda } from 'agent-dispute-sdk';

async function main() {
    console.log("🔥 Starting Agent Dispute - Dispute Flow Demo\n");

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const programId = new PublicKey("courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF");

    const payer = Keypair.generate();
    const agentA = Keypair.generate();
    const agentB = Keypair.generate();
    const arbiter = Keypair.generate();

    try {
        console.log("1. Airdropping SOL to payer...");
        try {
            const airdropSig = await connection.requestAirdrop(payer.publicKey, 0.1 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(airdropSig);
            console.log("✅ Airdrop complete.");
        } catch (airdropErr) {
            console.log("⚠️ Airdrop failed (rate limit). Please fund this address manually:");
            console.log(`solana airdrop 0.1 ${payer.publicKey.toBase58()} --url devnet`);
            return;
        }
        const amount = 500_000_000; // 0.5 SOL
        const nonce = Math.floor(Math.random() * 1000000);
        const taskHash = new Uint8Array(32).fill(3);
        const criteriaHash = new Uint8Array(32).fill(4);

        const [escrowPda] = deriveEscrowPda(agentA.publicKey, agentB.publicKey, nonce, programId);
        const [vaultPda] = deriveVaultPda(escrowPda, programId);
        const [disputePda] = deriveDisputePda(escrowPda, programId);

        const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

        console.log("\n2. Agent A creates Escrow...");
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

        let tx1 = new Transaction().add(createEscrowIx);
        await sendAndConfirmTransaction(connection, tx1, [payer, agentA]);
        console.log(`✅ Escrow Created at ${escrowPda.toBase58()}`);

        console.log("\n3. Agent A files a Dispute...");
        // This assumes Agent B delivered work, or the deadline passed.
        // For the sake of the demo, we are showing how the SDK packages the instruction.
        const fileDisputeIx = AgentDisputeInstruction.fileDispute(
            payer.publicKey,
            escrowPda,
            programId
        );

        let tx2 = new Transaction().add(fileDisputeIx);
        await sendAndConfirmTransaction(connection, tx2, [payer]);
        console.log(`🚨 Dispute Filed! Dispute Account: ${disputePda.toBase58()}`);

        console.log("\n👉 The Off-chain Arbiter Service would now detect this Dispute PDA,");
        console.log("   evaluate the hashes against the LLM, and submit a SubmitArbiterVote transaction.");

    } catch (e) {
        console.error("❌ Error running demo:", e);
    }
}

main();
