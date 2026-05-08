pub mod config;
pub mod solana;
pub mod llm;

use std::time::Duration;
use tokio::time::sleep;
use solana_sdk::signature::Signer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting Agent Dispute AI Arbiter Service...");
    
    let cfg = config::Config::load();
    let solana_svc = solana::SolanaService::new(&cfg.rpc_url, &cfg.keypair_path, cfg.program_id);
    let llm_svc = llm::LLMService::new(cfg.openai_api_key.clone());

    println!("Arbiter Pubkey: {}", solana_svc.keypair.pubkey());
    println!("Polling Solana every {} seconds...", cfg.poll_interval_secs);

    loop {
        let pending = solana_svc.get_pending_disputes();
        if pending.is_empty() {
            println!("No pending disputes found. Waiting...");
        } else {
            for (pubkey, dispute) in pending {
                println!("Found pending dispute: {}", pubkey);
                
                // Fetch live data for evaluation
                let escrow = match solana_svc.get_escrow(&dispute.escrow) {
                    Ok(e) => e,
                    Err(e) => {
                        println!("Failed to fetch escrow {}: {}", dispute.escrow, e);
                        continue;
                    }
                };

                let evidence = solana_svc.get_evidence_records(&dispute.escrow);
                let evidence_hashes: Vec<[u8; 32]> = evidence.iter().map(|e| e.content_hash).collect();

                println!("Evaluating with Task Hash: {:?}, Criteria Hash: {:?}, Evidence Count: {}", 
                    escrow.task_hash, escrow.criteria_hash, evidence_hashes.len());

                // Mock evaluation for demo
                let result = crate::llm::EvaluationResult {
                    vote: 2, // Winner = Agent B
                    reasoning_hash: [5u8; 32],
                };
                println!("LLM evaluated (MOCK)! Vote: {}, Reasoning Hash: {:?}", result.vote, result.reasoning_hash);
                
                match solana_svc.submit_vote(&dispute.escrow, &pubkey, result.vote, result.reasoning_hash) {
                    Ok(sig) => {
                        println!("Vote submitted! Signature: {}", sig);
                        // Small delay for blockchain confirmation
                        println!("Executing verdict...");
                        match solana_svc.execute_verdict(&dispute.escrow, &pubkey) {
                            Ok(sig) => println!("Verdict executed! Signature: {}", sig),
                            Err(e) => eprintln!("Failed to execute verdict: {}", e),
                        }
                    },
                    Err(e) => println!("Failed to submit vote: {}", e),
                }
            }
        }

        sleep(Duration::from_secs(cfg.poll_interval_secs)).await;
    }
}
