use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer, read_keypair_file},
    transaction::Transaction,
    instruction::{AccountMeta, Instruction},
};
use solana_client::rpc_filter::{RpcFilterType, Memcmp, MemcmpEncodedBytes};
use solana_client::rpc_config::{RpcProgramAccountsConfig, RpcAccountInfoConfig};
use std::sync::Arc;
use agent_dispute::state::{DisputeAccount, EscrowAccount, EvidenceRecord};
use borsh::BorshDeserialize;

pub struct SolanaService {
    pub client: Arc<RpcClient>,
    pub keypair: Keypair,
    pub program_id: Pubkey,
}

impl SolanaService {
    pub fn new(rpc_url: &str, keypair_path: &str, program_id: Pubkey) -> Self {
        let keypair = read_keypair_file(keypair_path).unwrap_or_else(|_| {
            println!("Warning: Could not read keypair at {}, using ephemeral keys", keypair_path);
            Keypair::new()
        });
        let client = Arc::new(RpcClient::new(rpc_url));
        Self { client, keypair, program_id }
    }

    /// Fetch all disputes that are pending (verdict == 0)
    pub fn get_pending_disputes(&self) -> Vec<(Pubkey, DisputeAccount)> {
        let accounts = match self.client.get_program_accounts_with_config(
            &self.program_id,
            RpcProgramAccountsConfig {
                filters: Some(vec![
                    RpcFilterType::Memcmp(Memcmp::new(
                        401, // Offset for verdict (correctly calculated for current DisputeAccount)
                        MemcmpEncodedBytes::Bytes(vec![0u8]), // VERDICT_PENDING
                    )),
                ]),
                account_config: RpcAccountInfoConfig {
                    encoding: Some(solana_account_decoder::UiAccountEncoding::Base64),
                    commitment: Some(solana_sdk::commitment_config::CommitmentConfig::confirmed()),
                    ..RpcAccountInfoConfig::default()
                },
                ..RpcProgramAccountsConfig::default()
            },
        ) {
            Ok(accs) => accs,
            Err(e) => {
                eprintln!("Error fetching program accounts: {}", e);
                return Vec::new();
            }
        };

        accounts.into_iter()
            .filter_map(|(pubkey, account)| {
                DisputeAccount::try_from_slice(&account.data).ok().map(|d| (pubkey, d))
            })
            .collect()
    }

    pub fn get_escrow(&self, pubkey: &Pubkey) -> Result<EscrowAccount, Box<dyn std::error::Error>> {
        let account = self.client.get_account(pubkey)?;
        let escrow = EscrowAccount::try_from_slice(&account.data)?;
        Ok(escrow)
    }

    pub fn get_evidence_records(&self, escrow: &Pubkey) -> Vec<EvidenceRecord> {
        let accounts = self.client.get_program_accounts_with_config(
            &self.program_id,
            RpcProgramAccountsConfig {
                filters: Some(vec![
                    RpcFilterType::DataSize(EvidenceRecord::LEN as u64),
                    RpcFilterType::Memcmp(Memcmp::new(
                        1, 
                        MemcmpEncodedBytes::Bytes(escrow.to_bytes().to_vec())
                    )),
                ]),
                ..RpcProgramAccountsConfig::default()
            }
        ).unwrap_or_default();

        accounts.into_iter()
            .filter_map(|(_, account)| EvidenceRecord::try_from_slice(&account.data).ok())
            .collect()
    }

    pub fn submit_vote(
        &self,
        escrow_pda: &Pubkey,
        dispute_pda: &Pubkey,
        vote: u8,
        reasoning_hash: [u8; 32],
    ) -> Result<String, Box<dyn std::error::Error>> {
        let mut data = vec![5u8];
        data.push(vote);
        // TODO: derive confidence from LLM response (e.g. logprobs or self-reported score) instead of hardcoding 100
        data.push(100);
        data.extend_from_slice(&reasoning_hash);

        let instruction = Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(self.keypair.pubkey(), true),
                AccountMeta::new(dispute_pda.clone(), false),
                AccountMeta::new(escrow_pda.clone(), false),
            ],
            data,
        };

        let latest_blockhash = self.client.get_latest_blockhash()?;
        let mut tx = Transaction::new_with_payer(&[instruction], Some(&self.keypair.pubkey()));
        tx.sign(&[&self.keypair], latest_blockhash);

        let sig = self.client.send_and_confirm_transaction(&tx)?;
        Ok(sig.to_string())
    }
    pub fn execute_verdict(
        &self,
        escrow_pda: &Pubkey,
        dispute_pda: &Pubkey,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let escrow = self.get_escrow(escrow_pda)?;
        
        let (vault_pda, _) = Pubkey::find_program_address(
            &[b"vault", escrow_pda.as_ref()],
            &self.program_id
        );

        let (rep_a, _) = Pubkey::find_program_address(
            &[b"reputation", escrow.agent_a.as_ref()],
            &self.program_id
        );

        let (rep_b, _) = Pubkey::find_program_address(
            &[b"reputation", escrow.agent_b.as_ref()],
            &self.program_id
        );

        let mut data = vec![6u8]; // Instruction index 6 for ExecuteVerdict

        let instruction = Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(self.keypair.pubkey(), true),
                AccountMeta::new(escrow_pda.clone(), false),
                AccountMeta::new(dispute_pda.clone(), false),
                AccountMeta::new(vault_pda, false),
                AccountMeta::new(escrow.agent_a, false),
                AccountMeta::new(escrow.agent_b, false),
                AccountMeta::new(rep_a, false),
                AccountMeta::new(rep_b, false),
                AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
            ],
            data,
        };

        let latest_blockhash = self.client.get_latest_blockhash()?;
        let mut tx = Transaction::new_with_payer(&[instruction], Some(&self.keypair.pubkey()));
        tx.sign(&[&self.keypair], latest_blockhash);

        let sig = self.client.send_and_confirm_transaction(&tx)?;
        Ok(sig.to_string())
    }
}
