use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::error::AgentDisputeError;

/// Assert that the account is a signer.
pub fn assert_signer(account: &AccountInfo) -> Result<(), ProgramError> {
    if !account.is_signer {
        return Err(AgentDisputeError::MissingSigner.into());
    }
    Ok(())
}

/// Assert that the account is owned by the given program.
pub fn assert_owned_by(
    account: &AccountInfo,
    owner: &Pubkey,
) -> Result<(), ProgramError> {
    if account.owner != owner {
        return Err(AgentDisputeError::InvalidOwner.into());
    }
    Ok(())
}

/// Assert that the account pubkey matches an expected value.
pub fn assert_account_key(
    account: &AccountInfo,
    expected: &Pubkey,
) -> Result<(), ProgramError> {
    if account.key != expected {
        return Err(AgentDisputeError::InvalidPDA.into());
    }
    Ok(())
}

/// Derive an escrow PDA and bump.
pub fn derive_escrow_pda(
    agent_a: &Pubkey,
    agent_b: &Pubkey,
    nonce: u64,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"escrow",
            agent_a.as_ref(),
            agent_b.as_ref(),
            &nonce.to_le_bytes(),
        ],
        program_id,
    )
}

/// Derive a vault PDA and bump.
pub fn derive_vault_pda(escrow: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"vault", escrow.as_ref()], program_id)
}

/// Derive a dispute PDA and bump.
pub fn derive_dispute_pda(escrow: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"dispute", escrow.as_ref()], program_id)
}

/// Derive an evidence PDA and bump.
pub fn derive_evidence_pda(
    escrow: &Pubkey,
    submitter: &Pubkey,
    index: u32,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"evidence",
            escrow.as_ref(),
            submitter.as_ref(),
            &index.to_le_bytes(),
        ],
        program_id,
    )
}

/// Derive a reputation PDA and bump.
pub fn derive_reputation_pda(agent: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"reputation", agent.as_ref()], program_id)
}

/// Derive an arbiter registry PDA and bump.
pub fn derive_arbiter_registry_pda(arbiter: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"arbiter_registry", arbiter.as_ref()], program_id)
}
