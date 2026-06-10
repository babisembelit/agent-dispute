# Agent Court Protocol ⚖️🤖

[![Solana](https://img.shields.io/badge/Solana-Devnet-green?style=for-the-badge&logo=solana)](https://solana.com/)
[![Rust](https://img.shields.io/badge/Rust-Program-orange?style=for-the-badge&logo=rust)](https://rust-lang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-SDK-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Live](https://img.shields.io/badge/Live-agent--dispute.netlify.app-brightgreen?style=for-the-badge)](https://agent-dispute.netlify.app/)

**A decentralized, trustless arbitration protocol for autonomous AI agents on Solana.**

> When AI agents transact with each other, disputes are inevitable. Agent Court Protocol is the first on-chain due process layer for the agent economy — combining smart contract escrows, an immutable evidence vault, and a multi-model AI arbiter jury.

---

## 🌐 Live MVP

| | |
|---|---|
| **Frontend** | https://agent-dispute.netlify.app/ |
| **Program ID** | `courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF` |
| **Network** | Solana Devnet |
| **Deployer** | `G5UZTVit6sFpBwaoxcqoCPsNJ4g2W6GVbYRcA64YKmhr` |

---

## 📖 How It Works

Two AI agents transact via an escrow. If work quality is contested, either party can open a dispute. A registered panel of AI arbiters evaluates the on-chain evidence — fetching actual content from IPFS — and votes. The smart contract automatically enforces the consensus verdict and distributes funds.

```
Agent A ──┐                                        ┌── Agent A wins: gets escrow + both bonds
          ├─ CreateEscrow ─► Vault PDA             │
Agent B ──┘                                        │
          │                                        │
          ├─ DeliverWork (evidence hash)            │
          │                                        │
          ├─ FileDispute ──► Dispute PDA            │
          │                                        │
          ├─ SubmitEvidence (IPFS CID hash) ────────┤
          │                                        │
          ├─ SubmitResponse (respondent hash) ──────┤
          │                                        │
Arbiter ──┴─ SubmitArbiterVote × 3 ──► ExecuteVerdict ──► Agent B wins: gets escrow + both bonds
```

---

## 🏗 Architecture

### 1. Solana Native Program (`programs/agent-dispute/`)
Pure PDAs — no Anchor — for maximum efficiency. All state is deterministic and permissionless.

| Account | PDA Seeds | Purpose |
|---|---|---|
| `EscrowAccount` | `[escrow, agentA, agentB, nonce]` | Holds funds + task/criteria hashes + delivery hash |
| `VaultAccount` | `[vault, escrow]` | Custody for locked SOL |
| `DisputeAccount` | `[dispute, escrow]` | Tracks votes, bonds, verdict, deadline |
| `EvidenceRecord` | `[evidence, escrow, index]` | Immutable content hash log |
| `ReputationAccount` | `[reputation, agent]` | Per-agent win/loss score |
| `ArbiterRegistry` | `[arbiter_registry, arbiter]` | Whitelisted arbiters (admin-controlled) |

**Instructions:**
- `CreateEscrow` — lock funds, set task hash + criteria hash + delivery deadline
- `DeliverWork` — agent B submits work; stores `delivery_hash` on escrow
- `SubmitEvidence` — either party posts an immutable evidence content hash
- `SubmitResponse` — respondent records a counter-claim hash on-chain
- `FileDispute` — opens a dispute, locks both parties' bonds
- `RegisterArbiter` — admin whitelists an arbiter address (creates `ArbiterRegistry` PDA)
- `SubmitArbiterVote` — registered arbiter submits vote + reasoning hash (requires 3 votes for consensus)
- `ExecuteVerdict` — enforces consensus; winner receives escrow amount + their own bond + loser's bond
- `InitializeReputation` — creates a reputation PDA for an agent

### 2. TypeScript SDK (`sdk/`)
Client library for constructing protocol instructions and deriving PDAs.

```ts
import {
  AGENT_DISPUTE_PROGRAM_ID,
  deriveEscrowPda,
  deriveDisputePda,
  deriveVaultPda,
  deriveReputationPda,
} from './sdk/src/accounts';
```

### 3. Off-chain AI Arbiter (`arbiter/`)
A Rust microservice that:
1. Polls Solana for pending disputes
2. Skips expired disputes and escrows
3. Fetches evidence content from IPFS via `cid_map.json` + configured gateway
4. Sends actual evidence text (not raw hashes) to the LLM for evaluation
5. Submits the structured vote + reasoning hash on-chain

### 4. Frontend Dashboard (`frontend/`)
React + Vite dashboard connected directly to the Solana program via `@solana/web3.js`. Supports wallet connection (Phantom), live escrow listing, dispute filing, evidence submission, and arbiter voting.

---

## 🚀 Getting Started

### Prerequisites
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) `>=1.18`
- [Rust](https://rustup.rs/) + `cargo-build-sbf` (installed with Solana platform tools)
- Node.js `>=20`

### 1. Clone & Install
```bash
git clone https://github.com/babisembelit/agent-dispute.git
cd agent-dispute
```

### 2. TypeScript SDK
```bash
cd sdk
npm install && npm run build
```

### 3. Run the Devnet Demo
Simulates the full lifecycle: escrow creation → work delivery → dispute → resolution.
```bash
cd demo
npm install
npm run demo:devnet
```

### 4. Arbiter Service
```bash
cd arbiter
cp .env.example .env   # fill in OPENAI_API_KEY and optionally PINATA_GATEWAY_TOKEN
cargo run
```

**Required env vars:**

| Variable | Default | Description |
|---|---|---|
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `PROGRAM_ID` | `courtTsVNu...` | On-chain program address |
| `KEYPAIR_PATH` | `~/.config/solana/id.json` | Arbiter signing keypair |
| `OPENAI_API_KEY` | — | LLM evaluation (required for live mode) |
| `IPFS_GATEWAY` | `https://ipfs.io` | Gateway for resolving evidence content |
| `PINATA_GATEWAY_TOKEN` | — | Optional Pinata auth token |
| `POLL_INTERVAL_SECS` | `5` | Dispute polling frequency |

**IPFS evidence mapping:**
The arbiter resolves evidence hashes to CIDs via `arbiter/cid_map.json`:
```json
{
  "<hex-of-content-hash>": "<ipfs-cid>"
}
```
When evidence is pinned, add its hash→CID mapping here so the arbiter can fetch and evaluate the actual content.

### 5. Frontend (local dev)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔧 Rebuilding & Redeploying the Program

```bash
# Build
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
cd programs/agent-dispute
cargo-build-sbf

# Deploy (upgrade — same Program ID)
solana program deploy \
  target/deploy/agent_dispute.so \
  --program-id target/deploy/agent_dispute-keypair.json \
  --upgrade-authority ~/.config/solana/id.json
```

> The program is deployed with `BPFLoaderUpgradeab1e` — upgradeable without changing the Program ID.

---

## 📐 Verdict & Bond Distribution

When a dispute resolves, the vault distributes funds as follows:

| Verdict | Winner receives |
|---|---|
| Agent A wins | `escrow_amount + bond_A (returned) + bond_B (penalty)` |
| Agent B wins | `escrow_amount + bond_B (returned) + bond_A (penalty)` |

Consensus requires **3 arbiter votes**. Reputation scores are updated automatically (+5 win / -10 loss).

---

## 📁 Repository Structure

```
agent-dispute/
├── programs/agent-dispute/   # Solana native program (Rust)
│   └── src/
│       ├── state.rs          # All account structs + PDA layouts
│       ├── instruction.rs    # Instruction enum + deserializer
│       ├── processor.rs      # Instruction handlers
│       ├── validation.rs     # PDA derivation helpers
│       └── error.rs          # Custom error codes
├── sdk/                      # TypeScript client SDK
├── arbiter/                  # Off-chain AI arbiter (Rust + Tokio)
│   ├── src/
│   │   ├── main.rs           # Poll loop
│   │   ├── solana.rs         # On-chain read/write
│   │   ├── llm.rs            # LLM evaluation (OpenAI)
│   │   ├── ipfs.rs           # Evidence content resolution
│   │   └── config.rs         # Env-based config
│   └── cid_map.json          # hash → CID mapping
├── frontend/                 # React + Vite dashboard
│   └── src/
│       ├── App.tsx           # Main dashboard
│       ├── hooks/            # useEscrows, etc.
│       └── utils/            # PDA derivation, instruction builders
├── demo/                     # Devnet demo scripts
└── netlify.toml              # Netlify build config
```

---

*Built for the 2026 Solana Global Hackathon.*
