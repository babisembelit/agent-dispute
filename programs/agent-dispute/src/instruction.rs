use solana_program::program_error::ProgramError;

/// All instructions supported by the Agent Dispute Protocol program.
#[derive(Debug)]
pub enum AgentDisputeInstruction {
    /// Create a new escrow between two agents.
    ///
    /// Accounts:
    /// 0. `[signer, writable]` agent_a (hiring agent, funds escrow)
    /// 1. `[]`                 agent_b (service provider)
    /// 2. `[writable]`         escrow_pda
    /// 3. `[writable]`         vault_pda (holds escrowed SOL)
    /// 4. `[]`                 system_program
    CreateEscrow {
        amount: u64,
        task_hash: [u8; 32],
        criteria_hash: [u8; 32],
        deadline: i64,
        nonce: u64,
    },

    /// Agent B marks work as delivered.
    ///
    /// Accounts:
    /// 0. `[signer]`    agent_b
    /// 1. `[writable]`  escrow_pda
    DeliverWork {
        evidence_hash: [u8; 32],
    },

    /// Agent A approves delivery and releases payment to Agent B.
    ///
    /// Accounts:
    /// 0. `[signer]`    agent_a
    /// 1. `[writable]`  escrow_pda
    /// 2. `[writable]`  vault_pda
    /// 3. `[writable]`  agent_b (receives SOL)
    /// 4. `[writable]`  reputation_b_pda
    /// 5. `[]`          system_program
    ApprovePayment,

    /// File a dispute against the other party.
    ///
    /// Accounts:
    /// 0. `[signer, writable]`  claimant
    /// 1. `[writable]`          escrow_pda
    /// 2. `[writable]`          dispute_pda (created)
    /// 3. `[writable]`          vault_pda (receives bond)
    /// 4. `[]`                  system_program
    FileDispute {
        claim_hash: [u8; 32],
        bond_amount: u64,
    },

    /// Submit evidence for an escrow.
    ///
    /// Accounts:
    /// 0. `[signer, writable]`  submitter
    /// 1. `[]`                  escrow_pda
    /// 2. `[writable]`          evidence_pda (created)
    /// 3. `[]`                  system_program
    SubmitEvidence {
        evidence_type: u8,
        content_hash: [u8; 32],
        evidence_index: u32,
    },

    /// An arbiter submits their vote on a dispute.
    ///
    /// Accounts:
    /// 0. `[signer]`    arbiter
    /// 1. `[writable]`  dispute_pda
    /// 2. `[]`          escrow_pda
    SubmitArbiterVote {
        winner: u8,
        confidence: u8,
        reasoning_hash: [u8; 32],
    },

    /// Execute the verdict once consensus is reached.
    ///
    /// Accounts:
    /// 0. `[signer]`    executor (permissionless)
    /// 1. `[writable]`  escrow_pda
    /// 2. `[writable]`  dispute_pda
    /// 3. `[writable]`  vault_pda
    /// 4. `[writable]`  agent_a
    /// 5. `[writable]`  agent_b
    /// 6. `[writable]`  reputation_a_pda
    /// 7. `[writable]`  reputation_b_pda
    /// 8. `[]`          system_program
    ExecuteVerdict,

    /// Initialize a reputation account for an agent.
    ///
    /// Accounts:
    /// 0. `[signer, writable]`  payer
    /// 1. `[]`                  agent
    /// 2. `[writable]`          reputation_pda (created)
    /// 3. `[]`                  system_program
    InitializeReputation,
}

impl AgentDisputeInstruction {
    /// Unpack instruction data from bytes.
    /// First byte is the instruction discriminator.
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;

        match tag {
            0 => {
                // CreateEscrow: u64 + [u8;32] + [u8;32] + i64 + u64 = 88 bytes
                if rest.len() < 88 {
                    return Err(ProgramError::InvalidInstructionData);
                }
                let amount = u64::from_le_bytes(rest[0..8].try_into().unwrap());
                let mut task_hash = [0u8; 32];
                task_hash.copy_from_slice(&rest[8..40]);
                let mut criteria_hash = [0u8; 32];
                criteria_hash.copy_from_slice(&rest[40..72]);
                let deadline = i64::from_le_bytes(rest[72..80].try_into().unwrap());
                let nonce = u64::from_le_bytes(rest[80..88].try_into().unwrap());

                Ok(Self::CreateEscrow {
                    amount,
                    task_hash,
                    criteria_hash,
                    deadline,
                    nonce,
                })
            }
            1 => {
                // DeliverWork: [u8;32] = 32 bytes
                if rest.len() < 32 {
                    return Err(ProgramError::InvalidInstructionData);
                }
                let mut evidence_hash = [0u8; 32];
                evidence_hash.copy_from_slice(&rest[0..32]);
                Ok(Self::DeliverWork { evidence_hash })
            }
            2 => Ok(Self::ApprovePayment),
            3 => {
                // FileDispute: [u8;32] + u64 = 40 bytes
                if rest.len() < 40 {
                    return Err(ProgramError::InvalidInstructionData);
                }
                let mut claim_hash = [0u8; 32];
                claim_hash.copy_from_slice(&rest[0..32]);
                let bond_amount = u64::from_le_bytes(rest[32..40].try_into().unwrap());
                Ok(Self::FileDispute {
                    claim_hash,
                    bond_amount,
                })
            }
            4 => {
                // SubmitEvidence: u8 + [u8;32] + u32 = 37 bytes
                if rest.len() < 37 {
                    return Err(ProgramError::InvalidInstructionData);
                }
                let evidence_type = rest[0];
                let mut content_hash = [0u8; 32];
                content_hash.copy_from_slice(&rest[1..33]);
                let evidence_index =
                    u32::from_le_bytes(rest[33..37].try_into().unwrap());
                Ok(Self::SubmitEvidence {
                    evidence_type,
                    content_hash,
                    evidence_index,
                })
            }
            5 => {
                // SubmitArbiterVote: u8 + u8 + [u8;32] = 34 bytes
                if rest.len() < 34 {
                    return Err(ProgramError::InvalidInstructionData);
                }
                let winner = rest[0];
                let confidence = rest[1];
                let mut reasoning_hash = [0u8; 32];
                reasoning_hash.copy_from_slice(&rest[2..34]);
                Ok(Self::SubmitArbiterVote {
                    winner,
                    confidence,
                    reasoning_hash,
                })
            }
            6 => Ok(Self::ExecuteVerdict),
            7 => Ok(Self::InitializeReputation),
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}
