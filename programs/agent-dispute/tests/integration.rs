use solana_program_test::*;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
    system_instruction,
    instruction::{AccountMeta, Instruction},
};
use agent_dispute::{
    processor, validation
};

#[tokio::test]
async fn test_create_escrow() {
    let program_id = Pubkey::new_unique();
    let mut program_test = ProgramTest::new(
        "agent_dispute",
        program_id,
        processor!(processor::process_instruction),
    );

    let mut context = program_test.start_with_context().await;
    let agent_a = Keypair::new();
    let agent_b = Keypair::new();
    let arbiter = Keypair::new();

    let amount: u64 = 1_000_000_000;
    let nonce: u64 = 123;
    let task_hash = [1u8; 32];
    let criteria_hash = [2u8; 32];
    let deadline: i64 = 1000;

    let mut data = vec![0u8]; // CreateEscrow instruction
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(&task_hash);
    data.extend_from_slice(&criteria_hash);
    data.extend_from_slice(&deadline.to_le_bytes()); // deadline comes after hashes in processor
    data.extend_from_slice(&nonce.to_le_bytes());

    let (escrow_pda, _) = validation::derive_escrow_pda(
        &agent_a.pubkey(),
        &agent_b.pubkey(),
        nonce,
        &program_id
    );
    let (vault_pda, _) = validation::derive_vault_pda(&escrow_pda, &program_id);

    let instruction = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(context.payer.pubkey(), true),
            AccountMeta::new_readonly(agent_a.pubkey(), false),
            AccountMeta::new_readonly(agent_b.pubkey(), false),
            AccountMeta::new_readonly(arbiter.pubkey(), false),
            AccountMeta::new(escrow_pda, false),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
        ],
        data,
    };

    let transaction = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(transaction).await.unwrap();

    let escrow_account = context.banks_client.get_account(escrow_pda).await.unwrap().unwrap();
    assert_eq!(escrow_account.owner, program_id);
}

#[tokio::test]
async fn test_full_dispute_lifecycle() {
    let program_id = Pubkey::new_unique();
    let mut program_test = ProgramTest::new(
        "agent_dispute",
        program_id,
        processor!(processor::process_instruction),
    );

    let mut context = program_test.start_with_context().await;
    let agent_a = Keypair::new();
    let agent_b = Keypair::new();
    let arbiter = Keypair::new();

    // 1. Create Escrow
    let amount: u64 = 1_000_000_000;
    let nonce: u64 = 456;
    let (escrow_pda, _) = validation::derive_escrow_pda(&agent_a.pubkey(), &agent_b.pubkey(), nonce, &program_id);
    let (vault_pda, _) = validation::derive_vault_pda(&escrow_pda, &program_id);

    let mut create_data = vec![0u8];
    create_data.extend_from_slice(&amount.to_le_bytes());
    create_data.extend_from_slice(&[1u8; 32]); // task
    create_data.extend_from_slice(&[2u8; 32]); // criteria
    create_data.extend_from_slice(&(2000i64).to_le_bytes()); // deadline
    create_data.extend_from_slice(&nonce.to_le_bytes());

    let create_tx = Transaction::new_signed_with_payer(
        &[Instruction {
            program_id,
            accounts: vec![
                AccountMeta::new(context.payer.pubkey(), true),
                AccountMeta::new_readonly(agent_a.pubkey(), false),
                AccountMeta::new_readonly(agent_b.pubkey(), false),
                AccountMeta::new_readonly(arbiter.pubkey(), false),
                AccountMeta::new(escrow_pda, false),
                AccountMeta::new(vault_pda, false),
                AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
            ],
            data: create_data,
        }],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    context.banks_client.process_transaction(create_tx).await.unwrap();

    // 2. Deliver Work
    let mut deliver_data = vec![1u8];
    deliver_data.extend_from_slice(&[3u8; 32]); // evidence hash
    
    let deliver_tx = Transaction::new_signed_with_payer(
        &[Instruction {
            program_id,
            accounts: vec![
                AccountMeta::new(agent_b.pubkey(), true),
                AccountMeta::new(escrow_pda, false),
            ],
            data: deliver_data,
        }],
        Some(&context.payer.pubkey()),
        &[&context.payer, &agent_b],
        context.last_blockhash,
    );
    context.banks_client.process_transaction(deliver_tx).await.unwrap();

    // 3. File Dispute
    let mut dispute_data = vec![3u8];
    dispute_data.extend_from_slice(&[4u8; 32]); // claim hash
    dispute_data.extend_from_slice(&0u64.to_le_bytes()); // bond
    
    let (dispute_pda, _) = validation::derive_dispute_pda(&escrow_pda, &program_id);

    let dispute_tx = Transaction::new_signed_with_payer(
        &[Instruction {
            program_id,
            accounts: vec![
                AccountMeta::new(agent_a.pubkey(), true),
                AccountMeta::new(escrow_pda, false),
                AccountMeta::new(dispute_pda, false),
                AccountMeta::new(vault_pda, false),
                AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
            ],
            data: dispute_data,
        }],
        Some(&context.payer.pubkey()),
        &[&context.payer, &agent_a],
        context.last_blockhash,
    );
    context.banks_client.process_transaction(dispute_tx).await.unwrap();

    // 4. Submit Arbiter Votes (3 votes)
    for i in 0..3 {
        let mut vote_data = vec![5u8];
        vote_data.push(2); // Winner = Agent B
        vote_data.push(90); // Confidence
        vote_data.extend_from_slice(&[i as u8; 32]); // reasoning hash
        
        let vote_tx = Transaction::new_signed_with_payer(
            &[Instruction {
                program_id,
                accounts: vec![
                    AccountMeta::new(arbiter.pubkey(), true),
                    AccountMeta::new(dispute_pda, false),
                    AccountMeta::new(escrow_pda, false),
                ],
                data: vote_data,
            }],
            Some(&context.payer.pubkey()),
            &[&context.payer, &arbiter],
            context.last_blockhash,
        );
        context.banks_client.process_transaction(vote_tx).await.unwrap();
    }

    // 5. Execute Verdict
    let execute_tx = Transaction::new_signed_with_payer(
        &[Instruction {
            program_id,
            accounts: vec![
                AccountMeta::new(context.payer.pubkey(), true),
                AccountMeta::new(escrow_pda, false),
                AccountMeta::new(dispute_pda, false),
                AccountMeta::new(vault_pda, false),
                AccountMeta::new(agent_a.pubkey(), false),
                AccountMeta::new(agent_b.pubkey(), false),
                AccountMeta::new(Pubkey::new_unique(), false), // rep A
                AccountMeta::new(Pubkey::new_unique(), false), // rep B
                AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
            ],
            data: vec![6u8],
        }],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    context.banks_client.process_transaction(execute_tx).await.unwrap();

    // Verify Agent B got the funds
    let agent_b_account = context.banks_client.get_account(agent_b.pubkey()).await.unwrap().unwrap();
    assert!(agent_b_account.lamports >= amount);
}
