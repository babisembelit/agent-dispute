# Agent Economic Dispute Resolution Protocol (Agent Court)

**Status:** ✅ ACCEPTED for Hackathon Development
**Date Validated:** 2026-04-16
**Confidence Level:** HIGH (No conflicts found, validated against 325+ projects)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [How It Works: Complete Example](#how-it-works-complete-example)
5. [Technical Architecture](#technical-architecture)
6. [Why This Is Novel](#why-this-is-novel)
7. [Market Opportunity](#market-opportunity)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Open Questions & Brainstorming Areas](#open-questions--brainstorming-areas)
10. [Research & Validation](#research--validation)

---

## Executive Summary

**One-Sentence Pitch:**
Agent Economic Dispute Resolution Protocol is a decentralized dispute resolution system for autonomous AI agents, using AI arbiters and smart contracts to resolve transaction conflicts without human intervention.

**Core Innovation:**
When two AI agents disagree about a transaction (quality, completion, payment), an AI arbiter committee evaluates evidence stored in an immutable vault and automatically enforces the verdict via smart contracts.

**Target Users:**
- Agent marketplace operators (AEP, XAAM, Habili)
- Enterprises deploying agent fleets
- Individual agent developers
- DeFi protocols using agents

**Unique Value:**
- First decentralized arbitration system specifically for autonomous agents
- Solves the "who watches the watchers" problem for AI economies
- Enables trustless agent-to-agent commerce at scale

---

## The Problem

### Problem Statement

When autonomous AI agents transact with each other, disputes are inevitable:

**Dispute Scenarios:**
1. **Quality Disputes**
   - Agent A hires Agent B to scrape data
   - Agent B delivers 10,000 data points
   - Agent A claims: "Only 5,000 are correct"
   - Agent B claims: "All 10,000 are correct"
   - **WHO DECIDES?**

2. **Non-Payment**
   - Agent B completes work perfectly
   - Agent A refuses to pay
   - Agent B has no recourse

3. **Incomplete Delivery**
   - Agent A pays upfront
   - Agent B goes offline mid-task
   - Agent A can't get refund

4. **Scope Disagreement**
   - Contract says "analyze BTC trends"
   - Agent A expected daily updates
   - Agent B provided weekly updates
   - Both interpretations seem valid

### Why Current Solutions Don't Work

| Solution | What It Does | Why It Fails for Agents |
|----------|--------------|------------------------|
| **Escrow (Agent Freight Orchestrator)** | Holds funds | Doesn't arbitrate when delivery is disputed |
| **Spending Controls (Mercantill, AgentVault)** | Prevents overspending | Prevention, not resolution |
| **Reputation Systems** | Tracks past behavior | Doesn't resolve active disputes |
| **Human Arbitration** | Humans judge disputes | Too slow, expensive, can't process technical evidence |
| **Legal System** | Courts resolve disputes | Too slow ($$$), agents aren't legal entities |

**The Gap:**
No system exists to **resolve disputes** between autonomous agents in a **decentralized**, **automated**, **fast**, and **technically-informed** way.

### Archive Evidence

**a16z crypto (Dec 2025):**
> "You might delegate an agent to manage staking rewards — only to find your funds rerouted to an obscure yield vault you've never heard of. You didn't sign that transaction — but you technically authorized it. These aren't edge cases. They're real scenarios."

**Galaxy Research (Feb 2026):**
> "Autonomous settlement between agents remain early and unproven at scale"

**Paradigm Research:**
> "Agent-to-agent interaction lacks coordination frameworks, secure identity, permissions, reputation"

---

## The Solution

### Core Mechanism

**Agent Court Protocol = Escrow + Evidence Vault + AI Arbiters + Automated Enforcement**

**Four Pillars:**

1. **Smart Contract Escrow**
   - Holds funds until both parties agree OR dispute is resolved
   - Immutable contract terms
   - Automated execution of verdicts

2. **Evidence Vault**
   - Both agents continuously submit execution logs
   - Immutable on-chain storage (can't be tampered)
   - Evidence: API responses, transaction receipts, computational proofs

3. **AI Arbiter Jury**
   - Committee of 3+ AI models (GPT-4, Claude, Llama)
   - Each arbiter independently evaluates evidence
   - Majority consensus determines verdict
   - Arbiters stake reputation (lose stake if consistently wrong)

4. **Reputation System**
   - Losing party's reputation decreases
   - Reputation affects future transaction terms:
     - Lower reputation = higher upfront payment required
     - Lower reputation = longer dispute windows
   - Creates accountability

### Key Differentiators

**vs. Existing Escrow:**
- Escrow only HOLDS funds
- Agent Court RESOLVES disputes when parties disagree

**vs. Human Arbitration:**
- Humans: Slow (days/weeks), expensive, limited tech understanding
- Agent Court: Fast (hours), cheap, native tech understanding

**vs. Traditional Courts:**
- Courts: Require legal entities, months/years, $$$$
- Agent Court: Autonomous agents, hours/days, $

---

## How It Works: Complete Example

### Scenario: Trading Agent Dispute

**Parties:**
- **Agent A:** "Trading Bot Alpha" (hires another agent)
- **Agent B:** "Market Data Pro" (provides market analysis)

**The Deal:**
- Payment: 100 USDC
- Task: Provide BTC price prediction for next 7 days
- Success Criteria: Prediction accuracy must be >80%
- Delivery: Within 24 hours

---

### Step 1: Transaction Setup

```
┌─────────────────────────────────────────────────┐
│     Agent A creates Escrow Contract            │
│                                                 │
│  Parties: Agent A, Agent B                     │
│  Amount: 100 USDC (locked in escrow)           │
│  Task: "Provide BTC price prediction"          │
│  Success Criteria: ">80% accuracy"             │
│  Evidence Requirements: Both submit logs       │
│  Dispute Window: 24h after delivery            │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│  100 USDC locked in Escrow Smart Contract      │
│  Neither party can touch funds yet             │
└─────────────────────────────────────────────────┘
```

---

### Step 2: Agent B Delivers Work

```
Agent B executes task:
├─ Runs analysis algorithms (GPT-4 + technical indicators)
├─ Generates prediction: "BTC will reach $95,000 in 7 days"
├─ Submits prediction to Agent A
└─ Uploads EXECUTION LOGS to Evidence Vault

Evidence Vault (On-Chain, Immutable):
├─ Timestamp: 2026-04-16 10:00 AM
├─ Input data sources: CoinGecko API, Binance API
├─ Algorithm: GPT-4 with RSI + MACD indicators
├─ Output: "$95,000 prediction"
├─ Confidence score: 85%
└─ Computation proof (hash of all inputs/outputs)
```

---

### Step 3a: Happy Path (No Dispute)

```
7 days later:
├─ BTC actual price: $92,000
├─ Agent A calculates: |95000 - 92000| / 95000 = 3.2% error
├─ Accuracy: 96.8% ✅ (exceeds 80% threshold)
└─ Agent A approves payment

Smart Contract:
├─ Releases 100 USDC → Agent B
├─ Updates reputation: Agent B +5 points
└─ Transaction complete ✅
```

---

### Step 3b: Dispute Path (Quality Disagreement)

```
7 days later:
├─ BTC actual price: $70,000 (dropped, not rose!)
├─ Agent A calculates: |95000 - 70000| / 95000 = 26% error
├─ Accuracy: 74% ❌ (below 80% threshold)
└─ Agent A: "This failed, I want my money back!"

Agent B disagrees:
├─ "My algorithm was correct based on available data"
├─ "Market conditions changed unexpectedly"
├─ "I fulfilled the contract in good faith"
└─ "I deserve payment!"

DISPUTE TRIGGERED 🚨
```

---

### Step 4: Dispute Resolution Process

#### Phase 1: Filing

```
Agent A files dispute:
├─ Stakes 10 USDC (dispute bond - prevents frivolous disputes)
├─ Submits evidence:
│   ├─ Original contract: "Accuracy must be >80%"
│   ├─ Agent B's prediction: "$95,000"
│   ├─ Actual result: "$70,000 on day 7"
│   ├─ Calculation: "74% accuracy = FAIL"
│   └─ Claim: "Breach of contract, request refund"
└─ Dispute submitted to blockchain

Agent B has 12 hours to respond:
├─ Stakes 10 USDC (shows good faith)
├─ Submits counter-evidence:
│   ├─ Execution logs: "Ran analysis correctly"
│   ├─ Data sources: "Used reliable APIs"
│   ├─ Algorithm quality: "GPT-4 + indicators"
│   ├─ Market context: "Unprecedented crash, black swan event"
│   └─ Claim: "Delivered as agreed, not responsible for market"
└─ Response recorded on-chain
```

---

#### Phase 2: AI Arbiter Committee Review

**The Arbiters:**
```
3 AI Models Selected:
├─ Arbiter 1: GPT-4 (OpenAI)
├─ Arbiter 2: Claude (Anthropic)
└─ Arbiter 3: Llama 3 (Meta)

Each has staked 50 reputation tokens to participate
```

**Evidence Package Sent to Each Arbiter:**
```json
{
  "contract": {
    "task": "Provide BTC price prediction for 7 days",
    "success_criteria": "Accuracy >80%",
    "payment": "100 USDC"
  },
  "agent_a_claim": {
    "prediction": "$95,000",
    "actual": "$70,000",
    "accuracy": "74%",
    "verdict": "REFUND"
  },
  "agent_b_claim": {
    "method": "GPT-4 + RSI + MACD",
    "data_quality": "Reliable APIs",
    "context": "Black swan market event",
    "verdict": "PAYMENT"
  },
  "execution_logs": [/* immutable logs */],
  "market_data": [/* on-chain price history */]
}
```

---

#### Phase 3: Independent Arbiter Decisions

**Arbiter 1 (GPT-4) Analysis:**
```
Reasoning:
1. Contract explicitly states: "Accuracy must be >80%"
2. Actual accuracy achieved: 74%
3. 74% < 80% = Objective failure to meet criteria
4. Agent B's methods were sound, but result matters
5. Contract is outcome-based, not effort-based

Verdict: Agent A wins (refund)
Confidence: 85%
Reasoning: "Clear contractual failure despite good faith effort"
```

**Arbiter 2 (Claude) Analysis:**
```
Reasoning:
1. Contract terms are unambiguous: >80% required
2. Agent B delivered prediction in good faith
3. Agent B used industry-standard methods
4. However, 74% objectively fails to meet 80% threshold
5. "Black swan" defense not mentioned in contract
6. Risk of market volatility assumed by predictor

Verdict: Agent A wins (refund)
Confidence: 90%
Reasoning: "Contractual obligation not met, regardless of market conditions"
```

**Arbiter 3 (Llama 3) Analysis:**
```
Reasoning:
1. Prediction quality: 74% is still decent
2. However, contract is clear: must exceed 80%
3. No force majeure clause in contract
4. Agent B bears prediction risk
5. Objective measurement: 74% < 80%

Verdict: Agent A wins (refund)
Confidence: 80%
Reasoning: "Below contractual threshold"
```

---

#### Phase 4: Consensus & Verdict

```
Vote Tally:
├─ Arbiter 1 (GPT-4):   Agent A wins
├─ Arbiter 2 (Claude):  Agent A wins
└─ Arbiter 3 (Llama 3): Agent A wins

Consensus: 3/3 UNANIMOUS

Final Verdict:
├─ Winner: Agent A
├─ Decision: Refund 100 USDC
├─ Reasoning Summary: "Prediction accuracy (74%) below
│   contractual threshold (80%). Despite good faith effort
│   and sound methodology, outcome-based contract not fulfilled."
└─ Verdict recorded on-chain (immutable)
```

---

### Step 5: Automated Enforcement

```
Smart Contract Execution:
┌──────────────────────────────────────────────┐
│  Escrow Contract reads verdict              │
│  ├─ Verdict: Agent A wins                   │
│  └─ Execute refund                          │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Fund Distribution:                          │
│  ├─ 100 USDC → Agent A (refund)             │
│  ├─ 10 USDC stake → Agent A (returned)      │
│  └─ 10 USDC stake → Agent B (returned)      │
│                                              │
│  Reputation Updates:                         │
│  ├─ Agent A: +5 (won fair dispute)          │
│  └─ Agent B: -10 (failed to deliver)        │
│                                              │
│  Arbiter Rewards:                            │
│  ├─ Total arbitration fee: 10 USDC          │
│  ├─ Split: 3.33 USDC each                   │
│  └─ Reputation: Each +2 (good decision)     │
└──────────────────────────────────────────────┘
           │
           ▼
     DISPUTE RESOLVED ✅
     (Fully automated, no human intervention)
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    USER LAYER                           │
│  ┌──────────┐           ┌──────────┐                   │
│  │ Agent A  │           │ Agent B  │                   │
│  └────┬─────┘           └─────┬────┘                   │
│       │                       │                         │
└───────┼───────────────────────┼─────────────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│              ON-CHAIN LAYER (Solana)                    │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  Escrow Smart Contract                      │       │
│  │  - Holds funds                              │       │
│  │  - Enforces contract terms                  │       │
│  │  - Executes verdicts                        │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  Evidence Vault                             │       │
│  │  - Immutable evidence storage               │       │
│  │  - Execution logs                           │       │
│  │  - Transaction receipts                     │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  Dispute Contract                           │       │
│  │  - Manages dispute lifecycle                │       │
│  │  - Collects arbiter votes                   │       │
│  │  - Triggers verdict execution               │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  Reputation Registry                        │       │
│  │  - Tracks agent reputation scores           │       │
│  │  - Updates based on dispute outcomes        │       │
│  └─────────────────────────────────────────────┘       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│            OFF-CHAIN LAYER (Servers)                    │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  AI Arbiter Network                         │       │
│  │                                             │       │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────┐│       │
│  │  │Arbiter 1  │  │Arbiter 2  │  │Arbiter 3 ││       │
│  │  │(GPT-4)    │  │(Claude)   │  │(Llama)   ││       │
│  │  └───────────┘  └───────────┘  └──────────┘│       │
│  │                                             │       │
│  │  - Fetches evidence from blockchain        │       │
│  │  - Analyzes with LLM                        │       │
│  │  - Submits verdict on-chain                 │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  Oracle Services                            │       │
│  │  - Real-world data (prices, events)         │       │
│  │  - Cross-chain data verification            │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

### Smart Contract Specifications

#### 1. Escrow Contract

```rust
use anchor_lang::prelude::*;

#[account]
pub struct EscrowAccount {
    // Parties
    pub agent_a: Pubkey,              // Hiring agent
    pub agent_b: Pubkey,              // Service provider

    // Financial
    pub amount: u64,                  // USDC locked in escrow
    pub agent_a_stake: u64,           // Dispute bond from A
    pub agent_b_stake: u64,           // Dispute bond from B

    // Contract Terms
    pub task_description: String,     // What Agent B must deliver
    pub success_criteria: String,     // Objective success metrics
    pub delivery_deadline: i64,       // Unix timestamp
    pub dispute_window: i64,          // How long can dispute be filed

    // Status
    pub status: EscrowStatus,         // Pending, Delivered, Disputed, Completed
    pub created_at: i64,
    pub delivered_at: Option<i64>,

    // Evidence & Dispute
    pub evidence_vault: Pubkey,       // Link to evidence account
    pub dispute: Option<Pubkey>,      // Link to dispute account (if any)

    // Metadata
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Pending,          // Agent B hasn't delivered yet
    Delivered,        // Agent B delivered, waiting for Agent A approval
    Disputed,         // Dispute filed, waiting for arbitration
    Completed,        // Payment released (or refunded)
    Cancelled,        // Cancelled before delivery
}

// Instructions
#[program]
pub mod agent_court {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        task_description: String,
        success_criteria: String,
        delivery_deadline: i64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.agent_a = ctx.accounts.agent_a.key();
        escrow.agent_b = ctx.accounts.agent_b.key();
        escrow.amount = amount;
        escrow.task_description = task_description;
        escrow.success_criteria = success_criteria;
        escrow.delivery_deadline = delivery_deadline;
        escrow.dispute_window = 86400; // 24 hours
        escrow.status = EscrowStatus::Pending;
        escrow.created_at = Clock::get()?.unix_timestamp;

        // Transfer USDC to escrow
        token::transfer(
            ctx.accounts.transfer_context(),
            amount
        )?;

        Ok(())
    }

    pub fn deliver_work(
        ctx: Context<DeliverWork>,
        evidence_hash: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Pending,
            ErrorCode::InvalidStatus
        );

        require!(
            ctx.accounts.agent_b.key() == escrow.agent_b,
            ErrorCode::Unauthorized
        );

        escrow.status = EscrowStatus::Delivered;
        escrow.delivered_at = Some(Clock::get()?.unix_timestamp);

        // Evidence submitted to vault (separate instruction)
        Ok(())
    }

    pub fn approve_payment(
        ctx: Context<ApprovePayment>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Delivered,
            ErrorCode::InvalidStatus
        );

        require!(
            ctx.accounts.agent_a.key() == escrow.agent_a,
            ErrorCode::Unauthorized
        );

        // Release funds to Agent B
        token::transfer(
            ctx.accounts.transfer_to_agent_b(),
            escrow.amount
        )?;

        // Update reputation
        update_reputation(&escrow.agent_b, 5)?;

        escrow.status = EscrowStatus::Completed;
        Ok(())
    }

    pub fn file_dispute(
        ctx: Context<FileDispute>,
        claim: String,
        stake_amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Delivered,
            ErrorCode::InvalidStatus
        );

        // Check dispute window
        let current_time = Clock::get()?.unix_timestamp;
        let delivered_time = escrow.delivered_at.unwrap();
        require!(
            current_time <= delivered_time + escrow.dispute_window,
            ErrorCode::DisputeWindowExpired
        );

        // Agent A stakes dispute bond
        escrow.agent_a_stake = stake_amount;
        escrow.status = EscrowStatus::Disputed;

        // Create dispute account
        create_dispute(
            &ctx.accounts.dispute,
            escrow.key(),
            claim
        )?;

        Ok(())
    }

    pub fn execute_verdict(
        ctx: Context<ExecuteVerdict>,
        winner: Winner,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let dispute = &ctx.accounts.dispute;

        require!(
            escrow.status == EscrowStatus::Disputed,
            ErrorCode::InvalidStatus
        );

        // Verify verdict consensus (majority of arbiters agree)
        require!(
            verify_consensus(dispute),
            ErrorCode::NoConsensus
        );

        match winner {
            Winner::AgentA => {
                // Refund to Agent A
                token::transfer(
                    ctx.accounts.transfer_to_agent_a(),
                    escrow.amount
                )?;

                // Return stakes
                return_stake(escrow.agent_a, escrow.agent_a_stake)?;
                return_stake(escrow.agent_b, escrow.agent_b_stake)?;

                // Update reputation
                update_reputation(&escrow.agent_a, 5)?;
                update_reputation(&escrow.agent_b, -10)?;
            },
            Winner::AgentB => {
                // Pay Agent B
                token::transfer(
                    ctx.accounts.transfer_to_agent_b(),
                    escrow.amount
                )?;

                // Agent A loses stake (frivolous dispute)
                transfer_stake_to_agent_b(
                    escrow.agent_a_stake
                )?;

                // Update reputation
                update_reputation(&escrow.agent_a, -10)?;
                update_reputation(&escrow.agent_b, 5)?;
            }
        }

        escrow.status = EscrowStatus::Completed;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Winner {
    AgentA,
    AgentB,
}
```

---

#### 2. Evidence Vault

```rust
#[account]
pub struct EvidenceVault {
    pub escrow_id: Pubkey,

    // Evidence from both parties
    pub agent_a_evidence: Vec<Evidence>,
    pub agent_b_evidence: Vec<Evidence>,

    // Execution logs (immutable)
    pub execution_logs: Vec<ExecutionLog>,

    // Timestamps
    pub created_at: i64,
    pub last_updated: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Evidence {
    pub submitter: Pubkey,
    pub evidence_type: EvidenceType,
    pub content_hash: String,      // IPFS hash or on-chain data
    pub timestamp: i64,
    pub description: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EvidenceType {
    ExecutionLog,          // Agent execution logs
    APIResponse,           // API call responses
    TransactionReceipt,    // On-chain transaction proof
    ComputationalProof,    // ZK-proof or hash of computation
    ExternalData,          // Oracle data (price, event)
    Testimony,             // Written claim
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ExecutionLog {
    pub agent: Pubkey,
    pub action: String,           // "API call", "computation", etc.
    pub input_hash: String,       // Hash of inputs
    pub output_hash: String,      // Hash of outputs
    pub timestamp: i64,
    pub metadata: String,         // JSON metadata
}

pub fn submit_evidence(
    ctx: Context<SubmitEvidence>,
    evidence_type: EvidenceType,
    content_hash: String,
    description: String,
) -> Result<()> {
    let vault = &mut ctx.accounts.evidence_vault;

    let evidence = Evidence {
        submitter: ctx.accounts.submitter.key(),
        evidence_type,
        content_hash,
        timestamp: Clock::get()?.unix_timestamp,
        description,
    };

    // Add to appropriate evidence list
    if ctx.accounts.submitter.key() == vault.escrow.agent_a {
        vault.agent_a_evidence.push(evidence);
    } else {
        vault.agent_b_evidence.push(evidence);
    }

    vault.last_updated = Clock::get()?.unix_timestamp;
    Ok(())
}
```

---

#### 3. Dispute Contract

```rust
#[account]
pub struct Dispute {
    pub escrow_id: Pubkey,

    // Claims
    pub agent_a_claim: String,        // Why Agent A wants refund
    pub agent_b_claim: String,        // Why Agent B deserves payment

    // Arbiter votes
    pub arbiter_votes: Vec<ArbiterVote>,
    pub required_votes: u8,           // Minimum votes needed (e.g., 3)

    // Verdict
    pub verdict: Option<Verdict>,
    pub consensus_reached: bool,
    pub executed: bool,

    // Timestamps
    pub filed_at: i64,
    pub deadline: i64,                // Arbiter voting deadline
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ArbiterVote {
    pub arbiter_id: Pubkey,
    pub winner: Winner,
    pub confidence: u8,               // 0-100
    pub reasoning: String,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Verdict {
    pub winner: Winner,
    pub consensus_percentage: u8,     // % of arbiters who agreed
    pub reasoning_summary: String,
    pub finalized_at: i64,
}

pub fn submit_arbiter_vote(
    ctx: Context<SubmitArbiterVote>,
    winner: Winner,
    confidence: u8,
    reasoning: String,
) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;

    // Verify arbiter is authorized
    require!(
        is_authorized_arbiter(&ctx.accounts.arbiter),
        ErrorCode::UnauthorizedArbiter
    );

    // Verify voting deadline not passed
    require!(
        Clock::get()?.unix_timestamp <= dispute.deadline,
        ErrorCode::VotingClosed
    );

    let vote = ArbiterVote {
        arbiter_id: ctx.accounts.arbiter.key(),
        winner,
        confidence,
        reasoning,
        timestamp: Clock::get()?.unix_timestamp,
    };

    dispute.arbiter_votes.push(vote);

    // Check if consensus reached
    if dispute.arbiter_votes.len() >= dispute.required_votes as usize {
        check_and_finalize_verdict(dispute)?;
    }

    Ok(())
}

fn check_and_finalize_verdict(dispute: &mut Dispute) -> Result<()> {
    let total_votes = dispute.arbiter_votes.len();
    let votes_for_a = dispute.arbiter_votes.iter()
        .filter(|v| v.winner == Winner::AgentA)
        .count();
    let votes_for_b = total_votes - votes_for_a;

    // Require majority (>50%)
    if votes_for_a > votes_for_b {
        dispute.verdict = Some(Verdict {
            winner: Winner::AgentA,
            consensus_percentage: ((votes_for_a as f64 / total_votes as f64) * 100.0) as u8,
            reasoning_summary: aggregate_reasoning(&dispute.arbiter_votes, Winner::AgentA),
            finalized_at: Clock::get()?.unix_timestamp,
        });
        dispute.consensus_reached = true;
    } else if votes_for_b > votes_for_a {
        dispute.verdict = Some(Verdict {
            winner: Winner::AgentB,
            consensus_percentage: ((votes_for_b as f64 / total_votes as f64) * 100.0) as u8,
            reasoning_summary: aggregate_reasoning(&dispute.arbiter_votes, Winner::AgentB),
            finalized_at: Clock::get()?.unix_timestamp,
        });
        dispute.consensus_reached = true;
    }

    Ok(())
}
```

---

#### 4. Reputation Registry

```rust
#[account]
pub struct ReputationAccount {
    pub agent: Pubkey,
    pub score: i64,                   // Can be negative
    pub disputes_won: u32,
    pub disputes_lost: u32,
    pub total_transactions: u32,
    pub last_updated: i64,
}

pub fn update_reputation(
    agent: &Pubkey,
    delta: i64,
) -> Result<()> {
    let reputation = get_or_create_reputation(agent)?;
    reputation.score += delta;
    reputation.last_updated = Clock::get()?.unix_timestamp;

    // Cap reputation
    if reputation.score > 1000 {
        reputation.score = 1000;
    } else if reputation.score < -1000 {
        reputation.score = -1000;
    }

    Ok(())
}

// Reputation affects transaction terms
pub fn calculate_required_escrow_percentage(
    agent: &Pubkey
) -> u8 {
    let reputation = get_reputation(agent);

    match reputation.score {
        900..=1000 => 50,     // High rep: only 50% upfront
        700..=899 => 75,      // Medium rep: 75% upfront
        _ => 100,             // Low rep: 100% upfront
    }
}
```

---

### Off-Chain AI Arbiter System

```python
# arbiter_service.py

import openai
import anthropic
from solana.rpc.api import Client
from solana.transaction import Transaction

class AIArbiter:
    def __init__(self, model_name, model_api_key):
        self.model_name = model_name
        self.api_key = model_api_key
        self.solana_client = Client("https://api.mainnet-beta.solana.com")

    async def evaluate_dispute(self, dispute_id: str):
        """
        Main evaluation loop for AI arbiter
        """
        # 1. Fetch evidence from blockchain
        evidence = await self.fetch_evidence(dispute_id)

        # 2. Parse evidence
        contract_terms = evidence['contract']
        agent_a_claim = evidence['agent_a_evidence']
        agent_b_claim = evidence['agent_b_evidence']
        execution_logs = evidence['execution_logs']
        external_data = evidence['external_data']

        # 3. Generate prompt for LLM
        prompt = self.create_evaluation_prompt(
            contract_terms,
            agent_a_claim,
            agent_b_claim,
            execution_logs,
            external_data
        )

        # 4. Get verdict from LLM
        verdict = await self.call_llm(prompt)

        # 5. Parse LLM response
        winner, confidence, reasoning = self.parse_llm_response(verdict)

        # 6. Submit verdict to blockchain
        await self.submit_verdict(
            dispute_id,
            winner,
            confidence,
            reasoning
        )

        return verdict

    def create_evaluation_prompt(
        self,
        contract_terms,
        agent_a_claim,
        agent_b_claim,
        execution_logs,
        external_data
    ):
        """
        Creates a structured prompt for LLM evaluation
        """
        return f"""
You are an impartial arbiter in a dispute between two autonomous AI agents.

CONTRACT TERMS:
- Task: {contract_terms['task']}
- Success Criteria: {contract_terms['success_criteria']}
- Payment: {contract_terms['payment']} USDC
- Deadline: {contract_terms['deadline']}

AGENT A'S CLAIM (Hiring Agent):
{agent_a_claim['summary']}

Evidence:
{self.format_evidence(agent_a_claim['evidence'])}

AGENT B'S CLAIM (Service Provider):
{agent_b_claim['summary']}

Evidence:
{self.format_evidence(agent_b_claim['evidence'])}

EXECUTION LOGS:
{self.format_logs(execution_logs)}

EXTERNAL DATA (On-Chain Verification):
{self.format_external_data(external_data)}

TASK:
1. Evaluate both claims objectively
2. Verify evidence against contract terms
3. Determine if Agent B met the success criteria
4. Provide your verdict with confidence level (0-100)

Your response MUST be in this JSON format:
{{
  "winner": "AGENT_A" or "AGENT_B",
  "confidence": <0-100>,
  "reasoning": "<detailed explanation>",
  "key_findings": [
    "<finding 1>",
    "<finding 2>",
    ...
  ]
}}

Provide your verdict:
"""

    async def call_llm(self, prompt: str):
        """
        Calls appropriate LLM based on arbiter model
        """
        if self.model_name == "gpt-4":
            return await self.call_openai(prompt)
        elif self.model_name == "claude":
            return await self.call_anthropic(prompt)
        elif self.model_name == "llama":
            return await self.call_llama(prompt)

    async def call_openai(self, prompt: str):
        client = openai.OpenAI(api_key=self.api_key)

        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are an impartial dispute arbiter."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Low temperature for consistency
            response_format={"type": "json_object"}
        )

        return response.choices[0].message.content

    async def submit_verdict(
        self,
        dispute_id: str,
        winner: str,
        confidence: int,
        reasoning: str
    ):
        """
        Submits arbiter verdict to Solana blockchain
        """
        # Build transaction to call submit_arbiter_vote
        instruction = self.build_vote_instruction(
            dispute_id,
            winner,
            confidence,
            reasoning
        )

        transaction = Transaction()
        transaction.add(instruction)

        # Sign and send
        signature = await self.solana_client.send_transaction(
            transaction,
            self.arbiter_keypair
        )

        return signature

# arbiter_coordinator.py

class ArbiterCoordinator:
    """
    Coordinates multiple AI arbiters for consensus
    """
    def __init__(self):
        self.arbiters = [
            AIArbiter("gpt-4", OPENAI_API_KEY),
            AIArbiter("claude", ANTHROPIC_API_KEY),
            AIArbiter("llama", LLAMA_API_KEY),
        ]

    async def process_dispute(self, dispute_id: str):
        """
        Run all arbiters in parallel
        """
        tasks = [
            arbiter.evaluate_dispute(dispute_id)
            for arbiter in self.arbiters
        ]

        verdicts = await asyncio.gather(*tasks)

        # All verdicts submitted to blockchain
        # Smart contract handles consensus logic

        return verdicts

# dispute_monitor.py

class DisputeMonitor:
    """
    Monitors blockchain for new disputes and triggers arbitration
    """
    def __init__(self):
        self.coordinator = ArbiterCoordinator()
        self.solana_client = Client("https://api.mainnet-beta.solana.com")

    async def monitor_disputes(self):
        """
        Listen for DisputeFiled events
        """
        # WebSocket connection to Solana
        async with websockets.connect("wss://api.mainnet-beta.solana.com") as ws:
            # Subscribe to program logs
            await ws.send(json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "logsSubscribe",
                "params": [
                    {"mentions": [AGENT_COURT_PROGRAM_ID]},
                    {"commitment": "confirmed"}
                ]
            }))

            while True:
                response = await ws.recv()
                event = json.loads(response)

                if self.is_dispute_filed_event(event):
                    dispute_id = self.extract_dispute_id(event)

                    # Trigger arbitration
                    await self.coordinator.process_dispute(dispute_id)
```

---

## Why This Is Novel

### Validation Results (2026-04-16)

**Projects Searched:** 325+ agent and dispute resolution projects

**Conflicts Found:** 0

**Closest Analogs:**

| Project | What It Does | Why It's Different |
|---------|--------------|-------------------|
| **Agent Freight Orchestrator** | AI freight negotiation with settlement | Basic escrow only, NO dispute arbitration |
| **AI Economy Protocol (AEP)** | Agent marketplace with payments | NO dispute resolution mechanism |
| **Mercantill** | Enterprise banking with spending limits | Controls/limits, NOT dispute resolution |
| **AgentVault** | Kill-switch for agent trades | Emergency stop, NOT conflict arbitration |
| **Blockpal Smart Delegation** | Delegation with permissions | Permission management, NOT disputes |

### Archive Evidence

**Galaxy Research (Feb 2026):**
> "Autonomous settlement between agents remain early and unproven at scale"
> "Agent-to-agent interaction lacks coordination frameworks, secure identity, permissions, reputation"

**a16z crypto (Dec 2025):**
> "You might delegate an agent to manage staking rewards — only to find your funds rerouted to an obscure yield vault you've never heard of. You didn't sign that transaction — but you technically authorized it. These aren't edge cases. They're real scenarios."

**Paradigm Research:**
> Protection needed against "on-chain entities they rely on (protocols, DAOs, or otherwise) failing"

**Key Finding:** No project addresses agent-to-agent dispute resolution. All focus on human-to-agent or prevention, not resolution.

---

## Market Opportunity

### Target Market Size

**Primary Markets:**

1. **Agent Marketplaces**
   - AI Economy Protocol (AEP) - Cypherpunk 2025
   - XAAM - Breakout 2025 (Honorable Mention - AI)
   - Habili Agent Network - Breakout 2025
   - AgentRyxx - Cypherpunk 2025
   - NewBabylonAI - Renaissance 2024
   - **Total:** 5+ marketplaces, growing rapidly

2. **Agent Infrastructure Providers**
   - 325+ AI agent projects in Colosseum
   - All need dispute resolution layer
   - Estimated TAM: Every agent transaction could use Agent Court

3. **Enterprise Agent Deployments**
   - Companies deploying agent fleets
   - Need internal dispute resolution
   - B2B market opportunity

4. **DeFi Protocols Using Agents**
   - Trading agents (NeuralTrader, RuhmDeFi, Agent Arc)
   - Vault management agents
   - Need recourse when agents fail

### Revenue Model

**Fee Structure:**

```
Per Dispute:
├─ Both parties pay 5 USDC arbitration fee
├─ Total pool: 10 USDC
├─ Distribution:
│   ├─ AI Arbiters: 6 USDC (2 USDC each for 3 arbiters)
│   ├─ Protocol Treasury: 3 USDC
│   └─ Staking Rewards: 1 USDC
└─ Projected volume: 1000 disputes/month = $10K/month revenue
```

**Additional Revenue Streams:**
- Premium features (expedited arbitration)
- Reputation API access for marketplaces
- Enterprise licensing for private deployments

### Competitive Advantages

1. **First Mover:** No existing agent dispute resolution
2. **Network Effects:** More agents → more disputes → better arbiters → attracts more agents
3. **Technical Moat:** AI arbiter quality improves over time (learning from cases)
4. **Integration:** Can be adopted by ALL agent marketplaces (not competitive)

---

## Implementation Roadmap

### Phase 1: MVP (Hackathon - 4 weeks)

**Week 1: Smart Contracts**
- ✅ Escrow contract (create, deliver, approve, refund)
- ✅ Evidence vault (submit, retrieve)
- ✅ Dispute contract (file, vote, execute)
- ✅ Basic reputation tracking

**Week 2: AI Arbiter Integration**
- ✅ Off-chain arbiter service (Python)
- ✅ LLM integration (GPT-4, Claude)
- ✅ Evidence parsing and prompt generation
- ✅ Verdict submission to blockchain

**Week 3: Frontend**
- ✅ Agent dashboard (create escrow, submit evidence)
- ✅ Dispute filing interface
- ✅ Verdict viewing
- ✅ Reputation display

**Week 4: Testing & Demo**
- ✅ End-to-end testing with mock agents
- ✅ Demo video showing full dispute flow
- ✅ Documentation
- ✅ Hackathon submission

**MVP Features:**
- Basic escrow (USDC only)
- Simple evidence submission (text + hash)
- 3 AI arbiters (GPT-4, Claude, Llama)
- Manual dispute triggering
- Basic reputation (win/loss tracking)

---

### Phase 2: Beta (Post-Hackathon - 3 months)

**Month 1-2: Enhanced Features**
- Multi-token support (SOL, BONK, etc.)
- Complex evidence types (API logs, ZK-proofs)
- Automated dispute detection (agent behavior analysis)
- Appeal mechanism (community review)
- Advanced reputation (ELO-style scoring)

**Month 2-3: Marketplace Integrations**
- SDK for agent marketplaces
- Plugin for AEP, XAAM, Habili
- Documentation for integration
- Partnership with 2-3 marketplaces

---

### Phase 3: Production (6-12 months)

**Scaling:**
- Arbiter network expansion (10+ models)
- Sharding for high throughput
- Cross-chain support (Ethereum, Base)
- Mobile app for agents

**Advanced Features:**
- Specialized arbiters (trading disputes, data disputes, etc.)
- Insurance integration (cover dispute losses)
- DAO governance (parameter adjustment)
- Arbiter marketplace (anyone can become arbiter)

**Enterprise:**
- Private deployment option
- Custom arbiter training
- SLA guarantees
- White-label solution

---

## Open Questions & Brainstorming Areas

### Technical Questions

**1. Arbiter Selection**
- ❓ How to prevent arbiter bias or collusion?
- 💡 Ideas: Random selection, stake slashing, reputation tracking
- 🔍 Research: Game theory for arbiter incentives

**2. Evidence Storage**
- ❓ Where to store large evidence files (videos, large datasets)?
- 💡 Ideas: IPFS + hash on-chain, Arweave, compressed on-chain
- 🔍 Research: Cost-benefit of different storage methods

**3. Appeal Mechanism**
- ❓ What if both parties disagree with AI verdict?
- 💡 Ideas: Human arbiter as final escalation, community vote, 2nd AI jury
- 🔍 Research: Multi-tier arbitration systems

**4. Cross-Chain Disputes**
- ❓ How to handle disputes where evidence is on different chains?
- 💡 Ideas: Cross-chain oracles, multi-chain evidence vault
- 🔍 Research: Bridging solutions for evidence

**5. Computation Proofs**
- ❓ How to verify Agent B actually performed the computation claimed?
- 💡 Ideas: ZK-proofs, trusted execution environments (TEE), reproducible builds
- 🔍 Research: Verifiable computation methods

---

### Economic Questions

**1. Arbiter Incentive Design**
- ❓ How to ensure arbiters remain honest long-term?
- 💡 Ideas: Reputation staking, slashing for bad verdicts, appeal review
- 🔍 Research: Mechanism design for incentive alignment

**2. Dispute Prevention**
- ❓ How to reduce frivolous disputes (cost to protocol)?
- 💡 Ideas: Escalating dispute bonds, reputation requirements, pre-dispute mediation
- 🔍 Research: Dispute resolution best practices

**3. Fee Structure**
- ❓ What's optimal fee to balance accessibility vs. arbiter quality?
- 💡 Ideas: Dynamic fees based on dispute complexity, tiered pricing
- 🔍 Research: Market research on willingness to pay

**4. Reputation Economics**
- ❓ How to prevent reputation washing (agent creates new identity)?
- 💡 Ideas: Stake required based on transaction size, identity verification, social graph
- 🔍 Research: Sybil resistance mechanisms

---

### Legal/Regulatory Questions

**1. Legal Standing**
- ❓ Are AI arbiter verdicts legally enforceable?
- 💡 Ideas: Binding arbitration agreements, DAO as legal entity
- 🔍 Research: Legal precedents for algorithmic arbitration

**2. Liability**
- ❓ Who is liable if arbiter makes wrong decision?
- 💡 Ideas: Insurance pool, limited liability DAO, terms of service
- 🔍 Research: Smart contract liability frameworks

**3. Data Privacy**
- ❓ How to handle sensitive evidence (trade secrets, personal data)?
- 💡 Ideas: Zero-knowledge proofs, encrypted evidence with arbiter keys
- 🔍 Research: Privacy-preserving arbitration

---

### Product Questions

**1. User Experience**
- ❓ How to make dispute filing simple for non-technical agents?
- 💡 Ideas: Templates for common disputes, guided workflows, AI assistance
- 🔍 Research: UX patterns for dispute platforms

**2. Integration**
- ❓ How to minimize integration effort for marketplaces?
- 💡 Ideas: SDK, plugins, no-code integration, API
- 🔍 Research: Marketplace integration best practices

**3. Governance**
- ❓ Who controls protocol parameters (fees, arbiter requirements, etc.)?
- 💡 Ideas: DAO governance, timelocked admin, immutable after launch
- 🔍 Research: Decentralized governance models

---

### Expansion Opportunities

**1. Beyond Agents**
- ❓ Could this work for human freelancers? (Upwork competitor)
- 💡 Ideas: Fork for human-to-human disputes, hybrid human+AI arbiters
- 🔍 Research: Gig economy dispute data

**2. Specialized Courts**
- ❓ Should we have domain-specific arbiters (trading, data, creative)?
- 💡 Ideas: Specialized arbiter training, expert witness integration
- 🔍 Research: Specialized arbitration systems

**3. Insurance Integration**
- ❓ Can we partner with Agent Insurance Pools (if someone builds it)?
- 💡 Ideas: Dispute resolution as input to insurance claims
- 🔍 Research: InsurTech + arbitration models

---

## Research & Validation

### Validation Summary

**Date:** 2026-04-16
**Method:** Colosseum Copilot API search + Archive research
**Scope:** 5,400+ project submissions, 60+ archives

**Results:**
- ✅ **0 conflicts** found
- ✅ **Novel approach** confirmed
- ✅ **Market need** validated by archives
- ✅ **No legal issues** (dispute resolution is legal)
- ✅ **Enforceable** (smart contracts + reputation)
- ✅ **Scalable** (algorithmic, not human-dependent)

### Key Research Sources

**Archive Documents Reviewed:**

1. **"Tourists in the bazaar: Why agents will need B2B payments"** (a16z crypto, Feb 2026)
   - Confirms need for agent-to-agent commerce infrastructure
   - No mention of dispute resolution

2. **"Agency by design: Preserving user control in a post-interface world"** (a16z crypto, Dec 2025)
   - Discusses multi-agent coordination needs
   - Identifies governance gaps

3. **"Understanding the Intersection of Crypto and AI"** (Galaxy Research, May 2024)
   - Maps AI + crypto landscape
   - "Autonomous settlement remains unproven"

4. **"Single-Agent vs. Multi-Agent"** (Alliance essays, May 2025)
   - Multi-agent systems technical overview
   - No economic coordination frameworks mentioned

**Projects Analyzed:**

- **Agent marketplaces:** AEP, XAAM, Habili, AgentRyxx, NewBabylonAI
- **Agent infrastructure:** 325+ projects
- **Dispute/escrow systems:** Agent Freight Orchestrator (basic escrow only)
- **Reputation systems:** 20+ projects (all passive scoring, no active resolution)

---

### Competitive Landscape

**Direct Competitors:** None found

**Adjacent Solutions:**

| Solution Type | Examples | Overlap | Gap |
|---------------|----------|---------|-----|
| Escrow | Agent Freight Orchestrator | Holds funds | Doesn't arbitrate disputes |
| Reputation | Solana Reputation Scorer, Rate ITT | Tracks history | Doesn't resolve conflicts |
| Marketplaces | AEP, XAAM | Facilitate transactions | No dispute mechanism |
| Controls | Mercantill, AgentVault | Prevents bad behavior | Doesn't fix after it happens |

**Conclusion:** Agent Court occupies a clear gap in the market.

---

## Next Steps for Brainstorming

### High-Priority Discussion Topics

1. **Arbiter Quality Assurance**
   - How to ensure AI arbiters improve over time?
   - Should we train custom models on past disputes?
   - How to handle edge cases AI can't resolve?

2. **Scalability Strategy**
   - Can we handle 10,000 disputes/day?
   - Sharding strategy?
   - Cost optimization for evidence storage?

3. **Go-to-Market**
   - Which marketplace to partner with first?
   - Pricing strategy (free tier vs. paid)?
   - Marketing angle (developer-focused vs. end-user)?

4. **Technical Deep-Dives**
   - ZK-proof integration for private evidence
   - Cross-chain evidence verification
   - Arbiter selection algorithm

5. **Edge Cases**
   - What if contract terms are ambiguous?
   - What if external data source (oracle) is compromised?
   - What if both agents are acting in bad faith (collusion)?

---

## Appendix

### Glossary

**Agent:** Autonomous AI software that performs tasks and transacts independently

**Arbiter:** AI model (LLM) that evaluates dispute evidence and provides verdict

**Escrow:** Smart contract that holds funds until conditions met or dispute resolved

**Evidence Vault:** Immutable on-chain storage of transaction logs and proof

**Reputation:** On-chain score tracking agent's dispute history and reliability

**Verdict:** Final decision by arbiter committee on who wins dispute

**Consensus:** Majority agreement among arbiters (e.g., 2/3 or 3/3)

---

### Technical Stack

**Blockchain:**
- Solana (primary chain)
- Anchor framework (smart contracts)
- SPL Token (USDC payments)

**AI Models:**
- GPT-4 (OpenAI)
- Claude (Anthropic)
- Llama 3 (Meta)

**Backend:**
- Python (arbiter service)
- Node.js (API server)
- PostgreSQL (off-chain indexing)

**Frontend:**
- React + TypeScript
- Solana wallet adapter
- TailwindCSS

**Infrastructure:**
- IPFS (evidence storage)
- Helius RPC (Solana access)
- AWS/GCP (arbiter hosting)

---

### Useful Links

**Colosseum:**
- Arena: https://arena.colosseum.org
- Copilot: https://arena.colosseum.org/copilot

**Research:**
- a16z crypto: https://a16zcrypto.com
- Galaxy Research: https://www.galaxy.com/insights/research
- Alliance essays: https://alliance.xyz/essays

**Technical:**
- Solana Docs: https://docs.solana.com
- Anchor: https://www.anchor-lang.com
- SPL Token: https://spl.solana.com/token

---

**Last Updated:** 2026-04-16
**Status:** Ready for hackathon implementation
**Next Review:** When ready to start building

---

*This document is a living specification. Update as brainstorming evolves.*
