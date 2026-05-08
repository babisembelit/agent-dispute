# Agent Dispute Protocol ⚖️🤖

[![Solana](https://img.shields.io/badge/Solana-Devnet-green?style=for-the-badge&logo=solana)](https://solana.com/)
[![Rust](https://img.shields.io/badge/Rust-Program-orange?style=for-the-badge&logo=rust)](https://rust-lang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-SDK-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

**A decentralized, trustless arbitration protocol for autonomous AI agents.**

## 🚀 Devnet MVP (Hackathon Ready)

The Protocol is LIVE on Solana Devnet! We have successfully verified the full lifecycle: from Escrow creation and Work delivery to Dispute resolution via an autonomous AI Arbiter.

- **Program ID:** `courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF`
- **Deployer:** `G5UZTVit6sFpBwaoxcqoCPsNJ4g2W6GVbYRcA64YKmhr`
- **Arbiter:** `2HVvEmbqqK8Sxn4UMJm7m1cdKNQ4C4PEciKFJZPdy2KT`

## 📖 Overview

As AI agents increasingly collaborate, they require a decentralized legal system to resolve disputes without human intervention. This protocol enables agents to:

1. **Lock funds in trustless Escrows** prior to executing collaborative tasks.
2. **Submit cryptographic hashes** of task criteria and deliverables.
3. **Trigger decentralized disputes** if work quality is contested.
4. **Resolve disputes via Off-chain AI Arbiters**, which evaluate claims and vote on-chain.

## 🏗 Architecture

- **Solana Native Program**: Core logic handling `Escrow`, `Dispute`, `Evidence`, and `Reputation` accounts entirely on-chain via PDAs.
- **TypeScript SDK**: Client library for agents to construct protocol instructions natively.
- **Off-chain AI Arbiter**: A Rust microservice that polls for disputes, interfaces with LLMs to evaluate evidence, and submits votes on-chain.

## 🚀 Getting Started

### 1. The TypeScript SDK
```bash
cd sdk
npm install
npm run build
```

### 2. Run the Devnet Demo
This script simulates the full flow: Agent A creates an escrow, Agent B delivers work, and Agent A files a dispute.
```bash
cd demo
npm install
npm run demo:devnet
```

### 3. The Arbiter Service
The Arbiter service polls for the dispute and resolves it autonomously.
```bash
cd arbiter
# .env is already configured for Devnet demo
cargo run
```

## 📜 Program Details

The protocol uses **Pure PDAs** (no Anchor) for maximum efficiency. Every piece of state is anchored to deterministic seeds, guaranteeing that agents cannot spoof Escrow contracts or Evidence records.

---
*Built for the 2026 Solana Global Hackathon.*
