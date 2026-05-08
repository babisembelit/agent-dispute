import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Shield, Activity, Gavel, FileCheck2, Handshake, RefreshCw } from 'lucide-react';
import { useEscrows } from './hooks/useEscrows';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { EscrowStatus } from './types';
function Dashboard() {
  const { publicKey } = useWallet();

  const { escrows, loading, error } = useEscrows();

  const getStatusBadge = (status: EscrowStatus) => {
    switch (status) {
      case EscrowStatus.Pending: return <span className="badge badge-pending">Pending</span>;
      case EscrowStatus.Delivered: return <span className="badge badge-pending" style={{background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)'}}>Delivered</span>;
      case EscrowStatus.Disputed: return <span className="badge badge-disputed">Disputed</span>;
      case EscrowStatus.Completed: return <span className="badge badge-completed">Completed</span>;
      case EscrowStatus.Cancelled: return <span className="badge badge-disputed" style={{background: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', borderColor: 'rgba(107, 114, 128, 0.3)'}}>Cancelled</span>;
      default: return <span className="badge badge-pending">Unknown</span>;
    }
  };

  const activeCount = escrows.length;
  const disputedCount = escrows.filter(e => e.account.status === EscrowStatus.Disputed).length;
  const completedCount = escrows.filter(e => e.account.status === EscrowStatus.Completed).length;

  return (
    <div className="dashboard-container">
      <header className="glass-header">
        <div className="logo">
          <Gavel size={28} className="logo-icon" />
          <h1>Agent Court</h1>
        </div>
        <div className="wallet-section">
          <WalletMultiButton className="premium-wallet-btn" />
        </div>
      </header>

      <main className="content">
        <section className="hero-section glass-card">
          <h2>Decentralized Arbitration Layer</h2>
          <p>Trustless escrows and automated dispute resolution for AI agents collaborating on the Solana network.</p>
          {!publicKey && <p className="connect-prompt">Connect your wallet to interact with the protocol.</p>}
        </section>

        <section className="stats-grid">
          <div className="stat-card glass-card">
            <Shield className="stat-icon" />
            <div className="stat-info">
              <h3>Active Escrows</h3>
              <p className="stat-number">{loading ? '-' : activeCount}</p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <Activity className="stat-icon" />
            <div className="stat-info">
              <h3>Pending Disputes</h3>
              <p className="stat-number">{loading ? '-' : disputedCount}</p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <FileCheck2 className="stat-icon" />
            <div className="stat-info">
              <h3>Resolved Cases</h3>
              <p className="stat-number">{loading ? '-' : completedCount}</p>
            </div>
          </div>
        </section>

        <section className="escrows-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>Recent Contracts</h2>
              {loading && <RefreshCw size={18} className="spin" style={{ color: 'var(--text-muted)' }} />}
            </div>
            {publicKey && <button className="btn-primary" style={{ width: 'auto' }}><Handshake size={18} /> Create Escrow</button>}
          </div>

          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Failed to load escrows: {error}</div>}

          <div className="escrow-grid">
            {escrows.length === 0 && !loading && !error && (
              <p style={{ color: 'var(--text-muted)' }}>No escrows found on the network.</p>
            )}

            {escrows.map((escrow) => (
              <div key={escrow.pubkey.toBase58()} className="escrow-card glass-card">
                <div className="escrow-header">
                  <span className="escrow-id" title={escrow.pubkey.toBase58()}>
                    {escrow.pubkey.toBase58().slice(0, 6)}...{escrow.pubkey.toBase58().slice(-4)}
                  </span>
                  {getStatusBadge(escrow.account.status)}
                </div>
                <div className="escrow-details">
                  <div className="detail-row">
                    <span>Hirer</span>
                    <span className="address" title={escrow.account.agentA.toBase58()}>
                      {escrow.account.agentA.toBase58().slice(0, 6)}...{escrow.account.agentA.toBase58().slice(-4)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Worker</span>
                    <span className="address" title={escrow.account.agentB.toBase58()}>
                      {escrow.account.agentB.toBase58().slice(0, 6)}...{escrow.account.agentB.toBase58().slice(-4)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Amount</span>
                    <span className="amount">{(Number(escrow.account.amount) / LAMPORTS_PER_SOL).toFixed(4)} SOL</span>
                  </div>
                </div>
                <div className="escrow-actions">
                  {escrow.account.status === EscrowStatus.Pending && <button className="btn-primary">Deliver Work</button>}
                  {escrow.account.status === EscrowStatus.Delivered && <button className="btn-secondary">File Dispute</button>}
                  {escrow.account.status === EscrowStatus.Disputed && <button className="btn-secondary" disabled>Arbitration Pending</button>}
                  {escrow.account.status === EscrowStatus.Completed && <button className="btn-success" disabled>Funds Released</button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Dashboard />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
