use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::{
    error::AgentDisputeError,
    instruction::AgentDisputeInstruction,
    state::*,
    validation::*,
};

/// Main instruction dispatcher.
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = AgentDisputeInstruction::unpack(input)?;

    match instruction {
        AgentDisputeInstruction::CreateEscrow {
            amount,
            task_hash,
            criteria_hash,
            deadline,
            nonce,
        } => {
            msg!("Instruction: CreateEscrow");
            process_create_escrow(
                program_id, accounts, amount, task_hash, criteria_hash,
                deadline, nonce,
            )
        }
        AgentDisputeInstruction::DeliverWork { evidence_hash } => {
            msg!("Instruction: DeliverWork");
            process_deliver_work(program_id, accounts, evidence_hash)
        }
        AgentDisputeInstruction::ApprovePayment => {
            msg!("Instruction: ApprovePayment");
            process_approve_payment(program_id, accounts)
        }
        AgentDisputeInstruction::FileDispute {
            claim_hash,
            bond_amount,
        } => {
            msg!("Instruction: FileDispute");
            process_file_dispute(program_id, accounts, claim_hash, bond_amount)
        }
        AgentDisputeInstruction::SubmitEvidence {
            evidence_type,
            content_hash,
            evidence_index,
        } => {
            msg!("Instruction: SubmitEvidence");
            process_submit_evidence(
                program_id, accounts, evidence_type, content_hash,
                evidence_index,
            )
        }
        AgentDisputeInstruction::SubmitArbiterVote {
            winner,
            confidence,
            reasoning_hash,
        } => {
            msg!("Instruction: SubmitArbiterVote");
            process_submit_arbiter_vote(
                program_id, accounts, winner, confidence, reasoning_hash,
            )
        }
        AgentDisputeInstruction::ExecuteVerdict => {
            msg!("Instruction: ExecuteVerdict");
            process_execute_verdict(program_id, accounts)
        }
        AgentDisputeInstruction::InitializeReputation => {
            msg!("Instruction: InitializeReputation");
            process_initialize_reputation(program_id, accounts)
        }
    }
}

// ─── Create Escrow ──────────────────────────────────────────────────────────

fn process_create_escrow(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    task_hash: [u8; 32],
    criteria_hash: [u8; 32],
    deadline: i64,
    nonce: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let agent_a = next_account_info(accounts_iter)?;
    let agent_b = next_account_info(accounts_iter)?;
    let escrow_pda = next_account_info(accounts_iter)?;
    let vault_pda = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    assert_signer(agent_a)?;

    // Derive and verify escrow PDA
    let (expected_escrow, escrow_bump) =
        derive_escrow_pda(agent_a.key, agent_b.key, nonce, program_id);
    assert_account_key(escrow_pda, &expected_escrow)?;

    // Derive and verify vault PDA
    let (expected_vault, vault_bump) =
        derive_vault_pda(escrow_pda.key, program_id);
    assert_account_key(vault_pda, &expected_vault)?;

    let clock = Clock::get()?;
    let rent = Rent::get()?;

    // Create escrow PDA account
    let escrow_rent = rent.minimum_balance(EscrowAccount::LEN);
    let escrow_seeds: &[&[u8]] = &[
        b"escrow",
        agent_a.key.as_ref(),
        agent_b.key.as_ref(),
        &nonce.to_le_bytes(),
        &[escrow_bump],
    ];

    invoke_signed(
        &system_instruction::create_account(
            agent_a.key,
            escrow_pda.key,
            escrow_rent,
            EscrowAccount::LEN as u64,
            program_id,
        ),
        &[agent_a.clone(), escrow_pda.clone(), system_program.clone()],
        &[escrow_seeds],
    )?;

    // Create vault PDA account (holds the escrowed SOL)
    let vault_rent = rent.minimum_balance(0);
    let vault_seeds: &[&[u8]] = &[
        b"vault",
        escrow_pda.key.as_ref(),
        &[vault_bump],
    ];

    invoke_signed(
        &system_instruction::create_account(
            agent_a.key,
            vault_pda.key,
            vault_rent.checked_add(amount)
                .ok_or(AgentDisputeError::Overflow)?,
            0,
            program_id,
        ),
        &[agent_a.clone(), vault_pda.clone(), system_program.clone()],
        &[vault_seeds],
    )?;

    // Initialize escrow state
    let escrow = EscrowAccount {
        is_initialized: true,
        agent_a: *agent_a.key,
        agent_b: *agent_b.key,
        amount,
        task_hash,
        criteria_hash,
        delivery_deadline: deadline,
        dispute_window: 86400, // 24 hours
        status: EscrowStatus::Pending,
        created_at: clock.unix_timestamp,
        delivered_at: 0,
        dispute_key: Pubkey::default(),
        nonce,
        bump: escrow_bump,
    };

    escrow.serialize(&mut &mut escrow_pda.data.borrow_mut()[..])?;

    msg!(
        "Escrow created: {} SOL from {} to {}",
        amount,
        agent_a.key,
        agent_b.key
    );
    Ok(())
}

// ─── Deliver Work ───────────────────────────────────────────────────────────

fn process_deliver_work(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _evidence_hash: [u8; 32],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let agent_b = next_account_info(accounts_iter)?;
    let escrow_pda = next_account_info(accounts_iter)?;

    assert_signer(agent_b)?;
    assert_owned_by(escrow_pda, program_id)?;

    let mut escrow = EscrowAccount::try_from_slice(&escrow_pda.data.borrow())?;

    if !escrow.is_initialized {
        return Err(AgentDisputeError::NotInitialized.into());
    }
    if escrow.status != EscrowStatus::Pending {
        return Err(AgentDisputeError::InvalidStatus.into());
    }
    if agent_b.key != &escrow.agent_b {
        return Err(AgentDisputeError::Unauthorized.into());
    }

    let clock = Clock::get()?;
    if clock.unix_timestamp > escrow.delivery_deadline {
        return Err(AgentDisputeError::DeadlineExpired.into());
    }

    escrow.status = EscrowStatus::Delivered;
    escrow.delivered_at = clock.unix_timestamp;
    escrow.serialize(&mut &mut escrow_pda.data.borrow_mut()[..])?;

    msg!("Work delivered by {}", agent_b.key);
    Ok(())
}

// ─── Approve Payment ────────────────────────────────────────────────────────

fn process_approve_payment(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let agent_a = next_account_info(accounts_iter)?;
    let escrow_pda = next_account_info(accounts_iter)?;
    let vault_pda = next_account_info(accounts_iter)?;
    let agent_b = next_account_info(accounts_iter)?;
    let reputation_b_pda = next_account_info(accounts_iter)?;
    let _system_program = next_account_info(accounts_iter)?;

    assert_signer(agent_a)?;
    assert_owned_by(escrow_pda, program_id)?;

    let mut escrow = EscrowAccount::try_from_slice(&escrow_pda.data.borrow())?;

    if !escrow.is_initialized {
        return Err(AgentDisputeError::NotInitialized.into());
    }
    if escrow.status != EscrowStatus::Delivered {
        return Err(AgentDisputeError::InvalidStatus.into());
    }
    if agent_a.key != &escrow.agent_a {
        return Err(AgentDisputeError::Unauthorized.into());
    }

    // Verify vault PDA
    let (expected_vault, _) = derive_vault_pda(escrow_pda.key, program_id);
    assert_account_key(vault_pda, &expected_vault)?;

    // Transfer all SOL from vault to agent_b
    let vault_lamports = **vault_pda.lamports.borrow();
    **vault_pda.try_borrow_mut_lamports()? -= vault_lamports;
    **agent_b.try_borrow_mut_lamports()? += vault_lamports;

    // Update reputation if account exists and is initialized
    if reputation_b_pda.data_len() > 0 && reputation_b_pda.owner == program_id {
        let mut rep =
            ReputationAccount::try_from_slice(&reputation_b_pda.data.borrow())?;
        if rep.is_initialized {
            rep.score += 5;
            rep.total_transactions += 1;
            rep.clamp_score();
            let clock = Clock::get()?;
            rep.last_updated = clock.unix_timestamp;
            rep.serialize(&mut &mut reputation_b_pda.data.borrow_mut()[..])?;
        }
    }

    escrow.status = EscrowStatus::Completed;
    escrow.serialize(&mut &mut escrow_pda.data.borrow_mut()[..])?;

    msg!("Payment approved: {} lamports to {}", vault_lamports, agent_b.key);
    Ok(())
}

// ─── File Dispute ───────────────────────────────────────────────────────────

fn process_file_dispute(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    claim_hash: [u8; 32],
    bond_amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let claimant = next_account_info(accounts_iter)?;
    let escrow_pda = next_account_info(accounts_iter)?;
    let dispute_pda = next_account_info(accounts_iter)?;
    let vault_pda = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    assert_signer(claimant)?;
    assert_owned_by(escrow_pda, program_id)?;

    let mut escrow = EscrowAccount::try_from_slice(&escrow_pda.data.borrow())?;

    if !escrow.is_initialized {
        return Err(AgentDisputeError::NotInitialized.into());
    }
    if escrow.status != EscrowStatus::Delivered {
        return Err(AgentDisputeError::InvalidStatus.into());
    }

    // Verify claimant is a party
    let is_agent_a = claimant.key == &escrow.agent_a;
    let is_agent_b = claimant.key == &escrow.agent_b;
    if !is_agent_a && !is_agent_b {
        return Err(AgentDisputeError::Unauthorized.into());
    }

    // Check dispute window
    let clock = Clock::get()?;
    if clock.unix_timestamp > escrow.delivered_at + escrow.dispute_window {
        return Err(AgentDisputeError::DisputeWindowExpired.into());
    }

    // Derive and verify dispute PDA
    let (expected_dispute, dispute_bump) =
        derive_dispute_pda(escrow_pda.key, program_id);
    assert_account_key(dispute_pda, &expected_dispute)?;

    // Create dispute PDA account
    let rent = Rent::get()?;
    let dispute_rent = rent.minimum_balance(DisputeAccount::LEN);
    let dispute_seeds: &[&[u8]] = &[
        b"dispute",
        escrow_pda.key.as_ref(),
        &[dispute_bump],
    ];

    invoke_signed(
        &system_instruction::create_account(
            claimant.key,
            dispute_pda.key,
            dispute_rent,
            DisputeAccount::LEN as u64,
            program_id,
        ),
        &[claimant.clone(), dispute_pda.clone(), system_program.clone()],
        &[dispute_seeds],
    )?;

    // Transfer bond to vault
    if bond_amount > 0 {
        invoke_signed(
            &system_instruction::transfer(claimant.key, vault_pda.key, bond_amount),
            &[claimant.clone(), vault_pda.clone(), system_program.clone()],
            &[],
        )?;
    }

    let respondent = if is_agent_a {
        escrow.agent_b
    } else {
        escrow.agent_a
    };

    // Initialize dispute state
    let dispute = DisputeAccount {
        is_initialized: true,
        escrow: *escrow_pda.key,
        claimant: *claimant.key,
        respondent,
        claim_hash,
        response_hash: [0u8; 32],
        bond_a: if is_agent_a { bond_amount } else { 0 },
        bond_b: if is_agent_b { bond_amount } else { 0 },
        votes: [ArbiterVote::default(); 3],
        vote_count: 0,
        required_votes: 1,
        verdict: VERDICT_PENDING,
        consensus_pct: 0,
        filed_at: clock.unix_timestamp,
        deadline: clock.unix_timestamp + 86400, // 24h voting deadline
        executed: false,
        bump: dispute_bump,
    };

    dispute.serialize(&mut &mut dispute_pda.data.borrow_mut()[..])?;

    // Update escrow
    escrow.status = EscrowStatus::Disputed;
    escrow.dispute_key = *dispute_pda.key;
    escrow.serialize(&mut &mut escrow_pda.data.borrow_mut()[..])?;

    msg!("Dispute filed by {} with bond {}", claimant.key, bond_amount);
    Ok(())
}

// ─── Submit Evidence ────────────────────────────────────────────────────────

fn process_submit_evidence(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    evidence_type: u8,
    content_hash: [u8; 32],
    evidence_index: u32,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let submitter = next_account_info(accounts_iter)?;
    let escrow_pda = next_account_info(accounts_iter)?;
    let evidence_pda = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    assert_signer(submitter)?;
    assert_owned_by(escrow_pda, program_id)?;

    let escrow = EscrowAccount::try_from_slice(&escrow_pda.data.borrow())?;
    if !escrow.is_initialized {
        return Err(AgentDisputeError::NotInitialized.into());
    }

    // Verify submitter is a party
    if submitter.key != &escrow.agent_a && submitter.key != &escrow.agent_b {
        return Err(AgentDisputeError::Unauthorized.into());
    }

    // Derive and verify evidence PDA
    let (expected_evidence, evidence_bump) =
        derive_evidence_pda(escrow_pda.key, submitter.key, evidence_index, program_id);
    assert_account_key(evidence_pda, &expected_evidence)?;

    // Create evidence PDA account
    let rent = Rent::get()?;
    let evidence_rent = rent.minimum_balance(EvidenceRecord::LEN);
    let evidence_seeds: &[&[u8]] = &[
        b"evidence",
        escrow_pda.key.as_ref(),
        submitter.key.as_ref(),
        &evidence_index.to_le_bytes(),
        &[evidence_bump],
    ];

    invoke_signed(
        &system_instruction::create_account(
            submitter.key,
            evidence_pda.key,
            evidence_rent,
            EvidenceRecord::LEN as u64,
            program_id,
        ),
        &[submitter.clone(), evidence_pda.clone(), system_program.clone()],
        &[evidence_seeds],
    )?;

    let clock = Clock::get()?;
    let ev_type = match evidence_type {
        0 => EvidenceType::ExecutionLog,
        1 => EvidenceType::ApiResponse,
        2 => EvidenceType::TransactionReceipt,
        3 => EvidenceType::ComputationalProof,
        4 => EvidenceType::ExternalData,
        5 => EvidenceType::Testimony,
        _ => return Err(ProgramError::InvalidInstructionData),
    };

    let record = EvidenceRecord {
        is_initialized: true,
        escrow: *escrow_pda.key,
        submitter: *submitter.key,
        evidence_type: ev_type,
        content_hash,
        timestamp: clock.unix_timestamp,
        index: evidence_index,
        bump: evidence_bump,
    };

    record.serialize(&mut &mut evidence_pda.data.borrow_mut()[..])?;

    msg!("Evidence submitted by {} (index {})", submitter.key, evidence_index);
    Ok(())
}

// ─── Submit Arbiter Vote ────────────────────────────────────────────────────

fn process_submit_arbiter_vote(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    winner: u8,
    confidence: u8,
    reasoning_hash: [u8; 32],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let arbiter = next_account_info(accounts_iter)?;
    let dispute_pda = next_account_info(accounts_iter)?;
    let _escrow_pda = next_account_info(accounts_iter)?;

    assert_signer(arbiter)?;
    assert_owned_by(dispute_pda, program_id)?;

    let mut dispute =
        DisputeAccount::try_from_slice(&dispute_pda.data.borrow())?;

    if !dispute.is_initialized {
        return Err(AgentDisputeError::NotInitialized.into());
    }
    if dispute.verdict != VERDICT_PENDING {
        return Err(AgentDisputeError::InvalidStatus.into());
    }

    // Check voting deadline
    let clock = Clock::get()?;
    if clock.unix_timestamp > dispute.deadline {
        return Err(AgentDisputeError::VotingClosed.into());
    }

    // Validate winner value
    if winner != VERDICT_AGENT_A && winner != VERDICT_AGENT_B {
        return Err(ProgramError::InvalidInstructionData);
    }

    // Check for duplicate vote
    for v in &dispute.votes {
        if !v.is_empty() && v.arbiter == *arbiter.key {
            return Err(AgentDisputeError::AlreadyVoted.into());
        }
    }

    // Find next empty vote slot
    let slot = dispute.vote_count as usize;
    if slot >= DisputeAccount::MAX_ARBITERS {
        return Err(AgentDisputeError::InvalidStatus.into());
    }

    dispute.votes[slot] = ArbiterVote {
        arbiter: *arbiter.key,
        winner,
        confidence,
        reasoning_hash,
        timestamp: clock.unix_timestamp,
    };
    dispute.vote_count += 1;

    // Check for consensus once all votes are in
    if dispute.vote_count >= dispute.required_votes {
        finalize_verdict(&mut dispute);
    }

    dispute.serialize(&mut &mut dispute_pda.data.borrow_mut()[..])?;

    msg!(
        "Arbiter {} voted: winner={}, confidence={}",
        arbiter.key,
        winner,
        confidence
    );
    Ok(())
}

/// Determine verdict from votes using simple majority.
fn finalize_verdict(dispute: &mut DisputeAccount) {
    let total = dispute.vote_count as usize;
    let votes_for_a = dispute
        .votes
        .iter()
        .filter(|v| !v.is_empty() && v.winner == VERDICT_AGENT_A)
        .count();
    let votes_for_b = total - votes_for_a;

    if votes_for_a > votes_for_b {
        dispute.verdict = VERDICT_AGENT_A;
        dispute.consensus_pct = ((votes_for_a * 100) / total) as u8;
    } else if votes_for_b > votes_for_a {
        dispute.verdict = VERDICT_AGENT_B;
        dispute.consensus_pct = ((votes_for_b * 100) / total) as u8;
    }
    // If tied, verdict remains PENDING (no consensus)
}

// ─── Execute Verdict ────────────────────────────────────────────────────────

fn process_execute_verdict(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let _executor = next_account_info(accounts_iter)?;
    let escrow_pda = next_account_info(accounts_iter)?;
    let dispute_pda = next_account_info(accounts_iter)?;
    let vault_pda = next_account_info(accounts_iter)?;
    let agent_a = next_account_info(accounts_iter)?;
    let agent_b = next_account_info(accounts_iter)?;
    let reputation_a_pda = next_account_info(accounts_iter)?;
    let reputation_b_pda = next_account_info(accounts_iter)?;
    let _system_program = next_account_info(accounts_iter)?;

    assert_owned_by(escrow_pda, program_id)?;
    assert_owned_by(dispute_pda, program_id)?;

    let mut escrow = EscrowAccount::try_from_slice(&escrow_pda.data.borrow())?;
    let mut dispute =
        DisputeAccount::try_from_slice(&dispute_pda.data.borrow())?;

    if escrow.status != EscrowStatus::Disputed {
        return Err(AgentDisputeError::InvalidStatus.into());
    }
    if dispute.verdict == VERDICT_PENDING {
        return Err(AgentDisputeError::NoConsensus.into());
    }
    if dispute.executed {
        return Err(AgentDisputeError::VerdictAlreadyExecuted.into());
    }

    // Verify accounts match escrow parties
    assert_account_key(agent_a, &escrow.agent_a)?;
    assert_account_key(agent_b, &escrow.agent_b)?;

    // Verify vault
    let (expected_vault, _) = derive_vault_pda(escrow_pda.key, program_id);
    assert_account_key(vault_pda, &expected_vault)?;

    // Distribute funds from vault
    let vault_lamports = **vault_pda.lamports.borrow();

    match dispute.verdict {
        VERDICT_AGENT_A => {
            // Refund: all vault SOL goes to Agent A
            **vault_pda.try_borrow_mut_lamports()? -= vault_lamports;
            **agent_a.try_borrow_mut_lamports()? += vault_lamports;

            update_reputation_account(reputation_a_pda, program_id, 5, true)?;
            update_reputation_account(reputation_b_pda, program_id, -10, false)?;
        }
        VERDICT_AGENT_B => {
            // Pay: all vault SOL goes to Agent B
            **vault_pda.try_borrow_mut_lamports()? -= vault_lamports;
            **agent_b.try_borrow_mut_lamports()? += vault_lamports;

            update_reputation_account(reputation_a_pda, program_id, -10, false)?;
            update_reputation_account(reputation_b_pda, program_id, 5, true)?;
        }
        _ => return Err(AgentDisputeError::NoConsensus.into()),
    }

    dispute.executed = true;
    dispute.serialize(&mut &mut dispute_pda.data.borrow_mut()[..])?;

    escrow.status = EscrowStatus::Completed;
    escrow.serialize(&mut &mut escrow_pda.data.borrow_mut()[..])?;

    msg!("Verdict executed: winner={}", dispute.verdict);
    Ok(())
}

/// Helper to update a reputation account.
fn update_reputation_account(
    rep_pda: &AccountInfo,
    program_id: &Pubkey,
    delta: i64,
    won: bool,
) -> ProgramResult {
    if rep_pda.data_len() == 0 || rep_pda.owner != program_id {
        // Reputation account not initialized — skip silently
        return Ok(());
    }

    let mut rep = ReputationAccount::try_from_slice(&rep_pda.data.borrow())?;
    if !rep.is_initialized {
        return Ok(());
    }

    rep.score += delta;
    rep.clamp_score();
    if won {
        rep.disputes_won += 1;
    } else {
        rep.disputes_lost += 1;
    }
    let clock = Clock::get()?;
    rep.last_updated = clock.unix_timestamp;
    rep.serialize(&mut &mut rep_pda.data.borrow_mut()[..])?;

    Ok(())
}

// ─── Initialize Reputation ─────────────────────────────────────────────────

fn process_initialize_reputation(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let agent = next_account_info(accounts_iter)?;
    let reputation_pda = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    assert_signer(payer)?;

    // Derive and verify reputation PDA
    let (expected_rep, rep_bump) =
        derive_reputation_pda(agent.key, program_id);
    assert_account_key(reputation_pda, &expected_rep)?;

    // Create reputation PDA account
    let rent = Rent::get()?;
    let rep_rent = rent.minimum_balance(ReputationAccount::LEN);
    let rep_seeds: &[&[u8]] = &[
        b"reputation",
        agent.key.as_ref(),
        &[rep_bump],
    ];

    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            reputation_pda.key,
            rep_rent,
            ReputationAccount::LEN as u64,
            program_id,
        ),
        &[payer.clone(), reputation_pda.clone(), system_program.clone()],
        &[rep_seeds],
    )?;

    let clock = Clock::get()?;
    let rep = ReputationAccount {
        is_initialized: true,
        agent: *agent.key,
        score: 100, // Start with positive reputation
        disputes_won: 0,
        disputes_lost: 0,
        total_transactions: 0,
        last_updated: clock.unix_timestamp,
        bump: rep_bump,
    };

    rep.serialize(&mut &mut reputation_pda.data.borrow_mut()[..])?;

    msg!("Reputation initialized for {}", agent.key);
    Ok(())
}
