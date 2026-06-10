use solana_program::program_error::ProgramError;
use thiserror::Error;

/// Custom errors for the Agent Dispute Protocol program.
#[derive(Error, Debug, Copy, Clone)]
pub enum AgentDisputeError {
    #[error("Invalid instruction data")]
    InvalidInstruction = 0,

    #[error("Account not initialized")]
    NotInitialized = 1,

    #[error("Account already initialized")]
    AlreadyInitialized = 2,

    #[error("Invalid escrow status for this operation")]
    InvalidStatus = 3,

    #[error("Unauthorized: signer is not an expected party")]
    Unauthorized = 4,

    #[error("Dispute window has expired")]
    DisputeWindowExpired = 5,

    #[error("Voting deadline has passed")]
    VotingClosed = 6,

    #[error("No consensus reached among arbiters")]
    NoConsensus = 7,

    #[error("Arbiter has already voted on this dispute")]
    AlreadyVoted = 8,

    #[error("Insufficient funds for this operation")]
    InsufficientFunds = 9,

    #[error("Invalid PDA derivation")]
    InvalidPDA = 10,

    #[error("Delivery deadline has passed")]
    DeadlineExpired = 11,

    #[error("Verdict has already been executed")]
    VerdictAlreadyExecuted = 12,

    #[error("Numerical overflow")]
    Overflow = 13,

    #[error("Invalid account owner")]
    InvalidOwner = 14,

    #[error("Missing required signer")]
    MissingSigner = 15,

    #[error("Arbiter is not registered in the arbiter registry")]
    ArbiterNotRegistered = 16,
}

impl From<AgentDisputeError> for ProgramError {
    fn from(e: AgentDisputeError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
