import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { EscrowAccount, EscrowStatus } from '../types';

const AGENT_DISPUTE_PROGRAM_ID = new PublicKey('courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF');

export interface ParsedEscrow {
  pubkey: PublicKey;
  account: EscrowAccount;
}

export function useEscrows() {
  const { connection } = useConnection();
  const [escrows, setEscrows] = useState<ParsedEscrow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEscrows() {
      try {
        setLoading(true);
        // Fetch all accounts owned by the program with exactly 211 bytes (EscrowAccount size)
        const accounts = await connection.getProgramAccounts(AGENT_DISPUTE_PROGRAM_ID, {
          filters: [
            { dataSize: 211 }
          ]
        });

        const parsedEscrows: ParsedEscrow[] = accounts.map(({ pubkey, account }) => {
          const data = account.data;
          let offset = 0;

          const isInitialized = data[offset] === 1;
          offset += 1;

          const agentA = new PublicKey(data.subarray(offset, offset + 32));
          offset += 32;

          const agentB = new PublicKey(data.subarray(offset, offset + 32));
          offset += 32;

          const amount = data.readBigUInt64LE(offset);
          offset += 8;

          const taskHash = new Uint8Array(data.subarray(offset, offset + 32));
          offset += 32;

          const criteriaHash = new Uint8Array(data.subarray(offset, offset + 32));
          offset += 32;

          const deliveryDeadline = data.readBigInt64LE(offset);
          offset += 8;

          const disputeWindow = data.readBigInt64LE(offset);
          offset += 8;

          const status = data[offset] as EscrowStatus;
          offset += 1;

          const createdAt = data.readBigInt64LE(offset);
          offset += 8;

          const deliveredAt = data.readBigInt64LE(offset);
          offset += 8;

          const disputeKey = new PublicKey(data.subarray(offset, offset + 32));
          offset += 32;

          const nonce = data.readBigUInt64LE(offset);
          offset += 8;

          const bump = data[offset];
          offset += 1;

          return {
            pubkey,
            account: {
              isInitialized,
              agentA,
              agentB,
              amount,
              taskHash,
              criteriaHash,
              deliveryDeadline,
              disputeWindow,
              status,
              createdAt,
              deliveredAt,
              disputeKey,
              nonce,
              bump
            }
          };
        });

        // Sort by created at descending (newest first)
        parsedEscrows.sort((a, b) => Number(b.account.createdAt - a.account.createdAt));

        setEscrows(parsedEscrows);
      } catch (err: any) {
        console.error("Failed to fetch escrows:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEscrows();
    
    // Set up an interval to refresh every 10 seconds
    const interval = setInterval(fetchEscrows, 10000);
    return () => clearInterval(interval);
  }, [connection]);

  return { escrows, loading, error };
}
