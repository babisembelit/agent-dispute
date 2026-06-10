use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

// ─── Escrow ─────────────────────────────────────────────────────────────────

/// Status of an escrow contract.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    /// Agent B hasn't delivered yet.
    Pending = 0,
    /// Agent B delivered, waiting for Agent A approval or dispute.
    Delivered = 1,
    /// Dispute filed, waiting for arbitration.
    Disputed = 2,
    /// Payment released or refunded — terminal state.
    Completed = 3,
    /// Cancelled before delivery — terminal state.
    Cancelled = 4,
}

/// Core escrow account.
/// PDA seeds: `[b"escrow", agent_a, agent_b, &nonce.to_le_bytes()]`
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct EscrowAccount {
    pub is_initialized: bool,
    pub agent_a: Pubkey,
    pub agent_b: Pubkey,
    pub amount: u64,
    pub task_hash: [u8; 32],
    pub criteria_hash: [u8; 32],
    pub delivery_deadline: i64,
    pub dispute_window: i64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub delivered_at: i64,
    pub dispute_key: Pubkey,
    pub nonce: u64,
    pub bump: u8,
    pub delivery_hash: [u8; 32],
}

impl EscrowAccount {
    /// Fixed serialized size in bytes.
    pub const LEN: usize =
          1           // is_initialized
        + 32          // agent_a
        + 32          // agent_b
        + 8           // amount
        + 32          // task_hash
        + 32          // criteria_hash
        + 8           // delivery_deadline
        + 8           // dispute_window
        + 1           // status (enum tag)
        + 8           // created_at
        + 8           // delivered_at
        + 32          // dispute_key
        + 8           // nonce
        + 1           // bump
        + 32;         // delivery_hash
    // = 243 bytes
}

// ─── Evidence ───────────────────────────────────────────────────────────────

/// Types of evidence that can be submitted.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy, PartialEq, Eq)]
pub enum EvidenceType {
    ExecutionLog = 0,
    ApiResponse = 1,
    TransactionReceipt = 2,
    ComputationalProof = 3,
    ExternalData = 4,
    Testimony = 5,
}

/// Single evidence record.
/// PDA seeds: `[b"evidence", escrow, submitter, &index.to_le_bytes()]`
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct EvidenceRecord {
    pub is_initialized: bool,
    pub escrow: Pubkey,
    pub submitter: Pubkey,
    pub evidence_type: EvidenceType,
    pub content_hash: [u8; 32],
    pub timestamp: i64,
    pub index: u32,
    pub bump: u8,
}

impl EvidenceRecord {
    pub const LEN: usize =
          1           // is_initialized
        + 32          // escrow
        + 32          // submitter
        + 1           // evidence_type
        + 32          // content_hash
        + 8           // timestamp
        + 4           // index
        + 1;          // bump
    // = 111 bytes
}

// ─── Dispute ────────────────────────────────────────────────────────────────

/// A single arbiter's vote.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy)]
pub struct ArbiterVote {
    pub arbiter: Pubkey,
    pub winner: u8,
    pub confidence: u8,
    pub reasoning_hash: [u8; 32],
    pub timestamp: i64,
}

impl ArbiterVote {
    pub const LEN: usize = 32 + 1 + 1 + 32 + 8; // = 74 bytes

    pub fn is_empty(&self) -> bool {
        self.arbiter == Pubkey::default()
    }
}

impl Default for ArbiterVote {
    fn default() -> Self {
        Self {
            arbiter: Pubkey::default(),
            winner: 0,
            confidence: 0,
            reasoning_hash: [0u8; 32],
            timestamp: 0,
        }
    }
}

/// Dispute account linked to an escrow.
/// PDA seeds: `[b"dispute", escrow]`
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct DisputeAccount {
    pub is_initialized: bool,
    pub escrow: Pubkey,
    pub claimant: Pubkey,
    pub respondent: Pubkey,
    pub claim_hash: [u8; 32],
    pub response_hash: [u8; 32],
    pub bond_a: u64,
    pub bond_b: u64,
    pub votes: [ArbiterVote; 3],
    pub vote_count: u8,
    pub required_votes: u8,
    pub verdict: u8,        // 0=Pending, 1=AgentA wins, 2=AgentB wins
    pub consensus_pct: u8,
    pub filed_at: i64,
    pub deadline: i64,
    pub executed: bool,
    pub bump: u8,
}

impl DisputeAccount {
    pub const MAX_ARBITERS: usize = 3;

    pub const LEN: usize =
          1                             // is_initialized
        + 32                            // escrow
        + 32                            // claimant
        + 32                            // respondent
        + 32                            // claim_hash
        + 32                            // response_hash
        + 8                             // bond_a
        + 8                             // bond_b
        + (ArbiterVote::LEN * 3)        // votes [74 * 3 = 222]
        + 1                             // vote_count
        + 1                             // required_votes
        + 1                             // verdict
        + 1                             // consensus_pct
        + 8                             // filed_at
        + 8                             // deadline
        + 1                             // executed
        + 1;                            // bump
    // = 421 bytes
}

// ─── Reputation ─────────────────────────────────────────────────────────────

/// Reputation account for an agent.
/// PDA seeds: `[b"reputation", agent]`
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ReputationAccount {
    pub is_initialized: bool,
    pub agent: Pubkey,
    pub score: i64,
    pub disputes_won: u32,
    pub disputes_lost: u32,
    pub total_transactions: u32,
    pub last_updated: i64,
    pub bump: u8,
}

impl ReputationAccount {
    pub const LEN: usize =
          1           // is_initialized
        + 32          // agent
        + 8           // score
        + 4           // disputes_won
        + 4           // disputes_lost
        + 4           // total_transactions
        + 8           // last_updated
        + 1;          // bump
    // = 62 bytes

    /// Reputation score bounds.
    pub const MAX_SCORE: i64 = 1000;
    pub const MIN_SCORE: i64 = -1000;

    /// Clamp score within bounds.
    pub fn clamp_score(&mut self) {
        if self.score > Self::MAX_SCORE {
            self.score = Self::MAX_SCORE;
        } else if self.score < Self::MIN_SCORE {
            self.score = Self::MIN_SCORE;
        }
    }
}

// ─── Arbiter Registry ───────────────────────────────────────────────────────

/// Marks an address as a registered arbiter, created by an admin.
/// PDA seeds: `[b"arbiter_registry", arbiter_pubkey]`
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ArbiterRegistry {
    pub is_initialized: bool,
    pub arbiter: Pubkey,
    pub admin: Pubkey,
    pub bump: u8,
}

impl ArbiterRegistry {
    pub const LEN: usize =
          1   // is_initialized
        + 32  // arbiter
        + 32  // admin
        + 1;  // bump
    // = 66 bytes
}

// ─── Winner Enum ────────────────────────────────────────────────────────────

/// Verdict winner constants.
pub const VERDICT_PENDING: u8 = 0;
pub const VERDICT_AGENT_A: u8 = 1;
pub const VERDICT_AGENT_B: u8 = 2;
