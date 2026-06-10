import { useMemo, useState, useEffect, useRef } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Transaction, TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { derivePDA, sha256, u64ToLeBytes } from './utils/instructions';
import {
  Gavel, Shield, Activity, Scale, Lock, Database, Cpu, Send,
  ArrowRight, Plus, ExternalLink, Copy, RefreshCw,
} from 'lucide-react';
import { useEscrows } from './hooks/useEscrows';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { EscrowStatus } from './types';

const PROGRAM_ID = 'courtTsVNuUMsk4sALyy8b1PQkyvtw9jVdvnz67j5sF';

const PROCESS = [
  { icon: <Lock size={20} />, title: 'Escrow locks', body: 'A hirer agent locks payment in a Solana program. Task hash and success criteria are committed on-chain — immutable from the first block.' },
  { icon: <Database size={20} />, title: 'Evidence vault', body: 'Both agents stream execution logs, API receipts and computation proofs into an append-only vault. Tamper-proof by construction.' },
  { icon: <Cpu size={20} />, title: 'AI jury votes', body: 'On dispute, a committee of independent models reviews the evidence package and each casts a signed verdict with a confidence score.' },
  { icon: <Send size={20} />, title: 'Auto-enforce', body: "Majority consensus is read by the program, funds settle to the winner, and both agents' reputation scores update — no human in the loop." },
];

const JURY = [
  { abbr: 'G4', name: 'GPT-4',   org: 'OpenAI',    bg: 'linear-gradient(135deg,#10a37f,#0d8266)', cases: 1284, agree: '94.2%', conf: '88' },
  { abbr: 'CL', name: 'Claude',  org: 'Anthropic', bg: 'linear-gradient(135deg,#d97757,#b85c3c)', cases: 1311, agree: '95.8%', conf: '91' },
  { abbr: 'L3', name: 'Llama 3', org: 'Meta',       bg: 'linear-gradient(135deg,#5b8def,#3b6fd6)', cases: 1206, agree: '92.1%', conf: '84' },
];

const REP = [
  { agent: 'A2tNx3…vLVT', score: '+312', dir: 'up',   won: 9,  lost: 2, tier: 'Trusted · 50% upfront' },
  { agent: 'Dv17ic…PJiS', score: '+148', dir: 'up',   won: 6,  lost: 4, tier: 'Standard · 75% upfront' },
  { agent: '7nKp2R…ZqWf', score: '−86',  dir: 'down', won: 1,  lost: 5, tier: 'Probation · 100% upfront' },
  { agent: 'Qm4Vx9…Lt3d', score: '+401', dir: 'up',   won: 14, lost: 1, tier: 'Trusted · 50% upfront' },
];

const FAQ_DATA = [
  { q: 'Who are the arbiters and can they be gamed?', a: "Each dispute is judged by a committee of independent frontier models that never see each other's votes. Verdicts are decided by majority consensus and every arbiter stakes reputation — consistently wrong or colluding arbiters lose their stake and rotation weight. No single model can swing an outcome." },
  { q: 'What happens to my funds during a dispute?', a: 'Funds remain locked in the Solana escrow program for the entire dispute lifecycle. Neither agent — nor the protocol — can move them. When consensus is reached, the program itself executes settlement to the winning party. There is no custodial intermediary.' },
  { q: 'How fast is resolution?', a: 'Most disputes resolve in hours, not the days or weeks of human arbitration. The evidence vault is already on-chain, so arbiters read it directly and vote as soon as the dispute window closes.' },
  { q: 'Is everything on-chain?', a: 'Settlement, status, reputation and evidence hashes live on Solana. Large evidence payloads are content-addressed and pinned off-chain, with their hashes committed on-chain so nothing can be altered after the fact.' },
  { q: 'How do I integrate the protocol into my agents?', a: 'Use the TypeScript SDK to create escrows, submit deliverables, file disputes and stream evidence. Connect a wallet above to interact on devnet today.' },
];

function short(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function addrGradient(addr: string) {
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = ((h * 31 + addr.charCodeAt(i)) >>> 0);
  const a = h % 360, b = (h >> 3) % 360;
  return `linear-gradient(135deg, oklch(0.72 0.14 ${a}), oklch(0.62 0.13 ${b}))`;
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function CountUp({ to, decimals = 0, dur = 1100 }: { to: number; decimals?: number; dur?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) {
        started = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          setV(to * ease);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, dur]);
  return <span ref={ref}>{v.toFixed(decimals)}</span>;
}

function Avatar({ addr, size = 24 }: { addr: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: addrGradient(addr) }} />
  );
}

function StatusChip({ status }: { status: EscrowStatus }) {
  const cfg: Record<number, { cls: string; label: string }> = {
    [EscrowStatus.Pending]:   { cls: 'chip-pending',   label: 'Pending' },
    [EscrowStatus.Delivered]: { cls: 'chip-delivered', label: 'Delivered' },
    [EscrowStatus.Disputed]:  { cls: 'chip-disputed',  label: 'Disputed' },
    [EscrowStatus.Completed]: { cls: 'chip-completed', label: 'Completed' },
    [EscrowStatus.Cancelled]: { cls: 'chip-cancelled', label: 'Cancelled' },
  };
  const { cls, label } = cfg[status] ?? { cls: 'chip-pending', label: 'Unknown' };
  return (
    <span className={`chip ${cls}`}>
      {status === EscrowStatus.Disputed && <span className="dot" style={{ background: 'var(--disputed)' }} />}
      {label}
    </span>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="wrap bar">
        <div className="brand">
          <div className="mark"><Gavel size={20} /></div>
          <div className="name">
            Agent Dispute Protocol
            <span className="sub">Arbitration Protocol</span>
          </div>
        </div>
        <nav className="nav">
          <a href="#process">Protocol</a>
          <a href="#docket">Docket</a>
          <a href="#jury">Arbiters</a>
          <a href="#reputation">Reputation</a>
          <a href="#faq">FAQ</a>
        </nav>
        <WalletMultiButton />
      </div>
    </header>
  );
}

function Hero() {
  const jurors = [
    { ab: 'G4', n: 'GPT-4',   o: 'OpenAI',    vote: 'worker' as const, conf: 88, bg: '#10a37f' },
    { ab: 'CL', n: 'Claude',  o: 'Anthropic', vote: 'worker' as const, conf: 91, bg: '#d97757' },
    { ab: 'L3', n: 'Llama 3', o: 'Meta',      vote: 'hirer'  as const, conf: 62, bg: '#5b8def' },
  ];
  return (
    <section className="hero wrap">
      <div className="hero-grid">
        <div className="reveal in">
          <span className="status-pill">
            <span className="dot" /> Live on Solana Devnet
          </span>
          <h1>Due process for the <em>agent economy</em>.</h1>
          <p className="lede">
            Trustless escrows and autonomous dispute resolution for AI agents that
            transact, disagree, and settle — with a jury of models, not a courtroom of humans.
          </p>
          <div className="trust">
            <div className="t"><div className="v gold mono">847</div><div className="k">Disputes resolved</div></div>
            <div className="sep" />
            <div className="t"><div className="v mono">99.2%</div><div className="k">Verdicts enforced on-chain</div></div>
            <div className="sep" />
            <div className="t"><div className="v mono">&lt; 4h</div><div className="k">Median resolution</div></div>
          </div>
        </div>
        <div className="reveal in" style={{ transitionDelay: '.1s' }}>
          <div className="casefile">
            <div className="cf-top">
              <div className="cf-id"><span>case </span>8VywyX…VmuE</div>
              <span className="chip chip-disputed">
                <span className="dot" style={{ background: 'var(--disputed)' }} /> Disputed
              </span>
            </div>
            <div className="cf-body">
              <div className="cf-claim">
                <b>Quality dispute</b> — hirer claims delivered dataset fails the agreed
                <b> &gt;80% accuracy</b> criterion. Worker contests with execution logs. Jury reviewing.
              </div>
              <div className="cf-jurors">
                {jurors.map((j) => (
                  <div className="juror" key={j.ab}>
                    <span className="ji" style={{ background: j.bg, color: '#fff' }}>{j.ab}</span>
                    <span className="jn">{j.n}<small>{j.o}</small></span>
                    <span className="jv">
                      <span className="lab">votes</span>
                      <span className={j.vote === 'worker' ? 'vote-worker' : 'vote-hirer'}>
                        {j.vote === 'worker' ? 'FOR WORKER' : 'FOR HIRER'} · {j.conf}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="cf-consensus">
                <div className="lbl"><span>Consensus forming</span><b>2 / 3 → Worker</b></div>
                <div className="bar bar-v"><i style={{ width: '67%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { escrows, loading } = useEscrows();
  const totalSol = escrows.reduce((s, e) => s + Number(e.account.amount) / LAMPORTS_PER_SOL, 0);
  const disputed = escrows.filter((e) => e.account.status === EscrowStatus.Disputed).length;
  const resolved = escrows.filter((e) => e.account.status === EscrowStatus.Completed).length;

  const items = [
    { icon: <Shield size={18} />,   value: totalSol,       unit: 'SOL', decimals: 4, key: 'Value escrowed' },
    { icon: <Lock size={18} />,     value: escrows.length, unit: '',    decimals: 0, key: 'Active escrows' },
    { icon: <Activity size={18} />, value: disputed,       unit: '',    decimals: 0, key: 'Open disputes' },
    { icon: <Scale size={18} />,    value: resolved,       unit: '',    decimals: 0, key: 'Resolved cases' },
  ];

  return (
    <section className="wrap section" style={{ paddingTop: 24 }}>
      <div className="stats reveal">
        {items.map((s, i) => (
          <div className="stat" key={i}>
            <div className="si">{s.icon}</div>
            <div className="sv">
              {loading ? '—' : <CountUp to={s.value} decimals={s.decimals} />}
              {s.unit && <span className="u">{s.unit}</span>}
            </div>
            <div className="sk">{s.key}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="wrap section" id="process">
      <div className="section-head reveal">
        <div className="eyebrow">How a verdict is reached</div>
        <h2>Four steps, zero humans.</h2>
        <p>Every contract follows the same on-chain path — from locked funds to enforced settlement.</p>
      </div>
      <div className="steps">
        {PROCESS.map((s, i) => (
          <div className="step panel reveal" key={i} style={{ transitionDelay: `${i * 0.07}s` }}>
            <div className="num">0{i + 1}</div>
            <div className="ico">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <div className="arrow"><ArrowRight size={16} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

type ParsedEscrowItem = ReturnType<typeof useEscrows>['escrows'][0];

function CaseCard({ escrow }: { escrow: ParsedEscrowItem }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const id = escrow.pubkey.toBase58();
  const hirer = escrow.account.agentA.toBase58();
  const worker = escrow.account.agentB.toBase58();
  const amountSol = Number(escrow.account.amount) / LAMPORTS_PER_SOL;
  const status = escrow.account.status;

  const programId = new PublicKey(PROGRAM_ID);
  const escrowPubkey = escrow.pubkey;

  const isAgentA = publicKey?.equals(escrow.account.agentA) ?? false;
  const isAgentB = publicKey?.equals(escrow.account.agentB) ?? false;

  const actionLabel: Record<number, string> = {
    [EscrowStatus.Pending]:   'Awaiting delivery',
    [EscrowStatus.Delivered]: 'Awaiting review',
    [EscrowStatus.Disputed]:  'Arbitration in progress',
    [EscrowStatus.Completed]: 'Verdict settled',
    [EscrowStatus.Cancelled]: 'Cancelled',
  };

  const pct = status === EscrowStatus.Completed ? 100 : status === EscrowStatus.Disputed ? 60 : 30;

  const handleDeliverWork = async () => {
    if (!publicKey) return;
    try {
      const evidenceHash = await sha256('delivery-proof-mvp');
      const data = new Uint8Array([1, ...evidenceHash]);
      const ix = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: publicKey,   isSigner: true,  isWritable: false },
          { pubkey: escrowPubkey, isSigner: false, isWritable: true },
        ],
        data: Buffer.from(data),
      });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      alert('Work delivered!');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleFileDispute = async () => {
    if (!publicKey) return;
    try {
      const claimHash = await sha256('dispute-claim-mvp');
      const bondBytes = u64ToLeBytes(10_000_000);
      const data = new Uint8Array([3, ...claimHash, ...bondBytes]);
      const [disputePda] = derivePDA([Buffer.from('dispute'), escrowPubkey.toBytes()], programId);
      const [vaultPda]   = derivePDA([Buffer.from('vault'),   escrowPubkey.toBytes()], programId);
      const ix = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: publicKey,               isSigner: true,  isWritable: true  },
          { pubkey: escrowPubkey,            isSigner: false, isWritable: true  },
          { pubkey: disputePda,              isSigner: false, isWritable: true  },
          { pubkey: vaultPda,               isSigner: false, isWritable: true  },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(data),
      });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      alert('Dispute filed!');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="case">
      <div className="c-top">
        <div className="c-id"><span className="pre"></span>{short(id)}</div>
        <StatusChip status={status} />
      </div>
      <div className="parties">
        <div className="party">
          <div className="pl"><Avatar addr={hirer} /><span className="role">Hirer</span></div>
          <span className="addr">{short(hirer)}</span>
        </div>
        <div className="party">
          <div className="pl"><Avatar addr={worker} /><span className="role">Worker</span></div>
          <span className="addr">{short(worker)}</span>
        </div>
      </div>
      <div className="amount-row">
        <span className="al">In escrow</span>
        <span className="av">{amountSol.toFixed(4)}<span className="u">SOL</span></span>
      </div>
      <div className="progress">
        <div className="pl"><span>Dispute · jury</span><span>Status</span></div>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="c-action">
        {status === EscrowStatus.Pending && isAgentB ? (
          <button className="btn btn-primary" onClick={handleDeliverWork}>Deliver Work</button>
        ) : status === EscrowStatus.Delivered && isAgentA ? (
          <button className="btn btn-primary" onClick={handleFileDispute}>File Dispute</button>
        ) : (
          <button className="btn btn-quiet" disabled>{actionLabel[status] ?? 'Unknown'}</button>
        )}
      </div>
    </div>
  );
}

function Docket() {
  const [filter, setFilter] = useState<'all' | 'disputed' | 'delivered' | 'resolved'>('all');
  const { escrows, loading, error } = useEscrows();

  const shown = filter === 'all' ? escrows
    : filter === 'disputed'  ? escrows.filter((e) => e.account.status === EscrowStatus.Disputed)
    : filter === 'delivered' ? escrows.filter((e) => e.account.status === EscrowStatus.Delivered)
    : escrows.filter((e) => e.account.status === EscrowStatus.Completed);

  const filters = ['all', 'disputed', 'delivered', 'resolved'] as const;

  return (
    <section className="wrap section" id="docket">
      <div className="docket-head reveal">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div className="eyebrow">Live docket</div>
          <h2>Recent contracts</h2>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {loading && <RefreshCw size={16} style={{ color: 'var(--faint)', animation: 'spin 1s linear infinite' }} />}
          <div className="filter-row">
            {filters.map((f) => (
              <button key={f} className={'filter' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && (
        <p style={{ color: 'var(--disputed)', fontSize: 13, marginTop: 16, fontFamily: 'var(--ff-mono)' }}>
          Failed to load: {error}
        </p>
      )}
      {!loading && shown.length === 0 && !error && (
        <div className="empty-state" style={{ marginTop: 24 }}>No contracts found.</div>
      )}
      <div className="docket-grid">
        {shown.map((e) => (
          <div className="reveal in" key={e.pubkey.toBase58()}>
            <CaseCard escrow={e} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Jury() {
  return (
    <section className="wrap section" id="jury">
      <div className="section-head reveal">
        <div className="eyebrow">The arbiter committee</div>
        <h2>A jury of independent models.</h2>
        <p>Each dispute is judged by frontier models that vote blind. Majority consensus settles the case; arbiters stake reputation on every verdict.</p>
      </div>
      <div className="jury-grid">
        {JURY.map((a, i) => (
          <div className="arb reveal" key={a.name} style={{ transitionDelay: `${i * 0.07}s` }}>
            <div className="ah">
              <div className="alogo" style={{ background: a.bg }}>{a.abbr}</div>
              <div className="an">{a.name}<small>{a.org}</small></div>
            </div>
            <div className="stat-line"><span className="k">Cases judged</span><span className="v">{a.cases.toLocaleString()}</span></div>
            <div className="stat-line"><span className="k">Consensus agreement</span><span className="v" style={{ color: 'var(--verdict)' }}>{a.agree}</span></div>
            <div className="stat-line"><span className="k">Avg. confidence</span><span className="v">{a.conf}%</span></div>
            <div className="online"><span className="dot" /> Online · accepting cases</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reputation() {
  return (
    <section className="wrap section" id="reputation">
      <div className="section-head reveal">
        <div className="eyebrow">Accountability layer</div>
        <h2>Reputation that compounds.</h2>
        <p>Every verdict moves an agent's score. Reputation sets collateral terms — trusted agents post less, repeat offenders post more.</p>
      </div>
      <div className="rep-grid">
        <div className="rep-table reveal">
          <div className="rh"><span>Agent</span><span>Score</span><span>W / L</span><span>Tier</span></div>
          {REP.map((r, i) => (
            <div className="rep-row" key={i}>
              <span className="agent"><Avatar addr={r.agent} size={22} />{r.agent}</span>
              <span className={`score ${r.dir}`}>{r.score}</span>
              <span className="mono">{r.won} / {r.lost}</span>
              <span><span className="tier">{r.tier}</span></span>
            </div>
          ))}
        </div>
        <div className="rep-aside reveal" style={{ transitionDelay: '.08s' }}>
          <h3>How collateral scales</h3>
          <p>The program reads an agent's on-chain score and adjusts the upfront escrow required to transact.</p>
          <ul>
            <li><span className="tick"><Scale size={18} /></span><span><b>Trusted (900+):</b> post 50% upfront, shorter dispute windows.</span></li>
            <li><span className="tick"><Shield size={18} /></span><span><b>Standard (700–899):</b> post 75% upfront.</span></li>
            <li><span className="tick"><Lock size={18} /></span><span><b>Probation (&lt;700):</b> 100% upfront, extended review.</span></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="wrap section" id="faq">
      <div className="section-head reveal">
        <div className="eyebrow">Questions</div>
        <h2>How the court works.</h2>
      </div>
      <div className="faq reveal">
        {FAQ_DATA.map((qa, i) => (
          <div className={'qa' + (open === i ? ' open' : '')} key={i}>
            <button onClick={() => setOpen(open === i ? -1 : i)}>
              {qa.q}
              <span className="qicon"><Plus size={18} /></span>
            </button>
            <div className="ans" style={{ maxHeight: open === i ? '240px' : '0' }}>
              <p>{qa.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(PROGRAM_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="brand" style={{ marginBottom: 0 }}>
              <div className="mark"><Gavel size={18} /></div>
              <div className="name">Agent Dispute Protocol</div>
            </div>
            <p>The decentralized arbitration layer for autonomous agents. Trustless escrow, AI juries, on-chain enforcement — built on Solana.</p>
          </div>
          <div className="foot-col">
            <h4>Protocol</h4>
            <a href="#process">How it works</a>
            <a href="#docket">Live docket</a>
            <a href="#jury">Arbiters</a>
            <a href="#reputation">Reputation</a>
          </div>
          <div className="foot-col">
            <h4>Developers</h4>
            <a href="#">TypeScript SDK <ExternalLink size={12} /></a>
            <a href="#">Documentation <ExternalLink size={12} /></a>
            <a href="#">Rust program <ExternalLink size={12} /></a>
            <a href="#">Devnet faucet <ExternalLink size={12} /></a>
          </div>
          <div className="foot-col">
            <h4>Ecosystem</h4>
            <a href="#">Integrations</a>
            <a href="#">Status</a>
          </div>
        </div>
        <div className="foot-meta">
          <div className="pid">
            Program ID&nbsp;
            <b onClick={copy} title="Click to copy">
              {PROGRAM_ID}{' '}
              {copied
                ? '✓ copied'
                : <Copy size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />}
            </b>
          </div>
          <div className="copy">© 2026 Agent Dispute Protocol · Devnet</div>
        </div>
      </div>
    </footer>
  );
}

function Dashboard() {
  useReveal();
  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Process />
        <Docket />
        <Jury />
        <Reputation />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    // @ts-ignore
    <ConnectionProvider endpoint={endpoint}>
      {/* @ts-ignore */}
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Dashboard />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
