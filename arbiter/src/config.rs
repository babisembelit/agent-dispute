use serde::Deserialize;
use std::env;
use dotenvy::dotenv;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub rpc_url: String,
    pub program_id: Pubkey,
    pub keypair_path: String,
    pub openai_api_key: Option<String>,
    pub anthropic_api_key: Option<String>,
    pub poll_interval_secs: u64,
}

impl Config {
    pub fn load() -> Self {
        dotenv().ok(); // Load from .env if present

        let rpc_url = env::var("SOLANA_RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8899".to_string());
        
        let program_id_str = env::var("PROGRAM_ID")
            .unwrap_or_else(|_| "Dispute111111111111111111111111111111111111".to_string());
        let program_id = Pubkey::from_str(&program_id_str).expect("Invalid PROGRAM_ID");

        let keypair_path = env::var("ARBITER_KEYPAIR_PATH")
            .unwrap_or_else(|_| "~/.config/solana/id.json".to_string());

        let openai_api_key = env::var("OPENAI_API_KEY").ok();
        let anthropic_api_key = env::var("ANTHROPIC_API_KEY").ok();

        let poll_interval_secs = env::var("POLL_INTERVAL_SECS")
            .unwrap_or_else(|_| "5".to_string())
            .parse()
            .unwrap_or(5);

        Self {
            rpc_url,
            program_id,
            keypair_path,
            openai_api_key,
            anthropic_api_key,
            poll_interval_secs,
        }
    }
}
