import React from 'react';
import { Workflow, ShieldCheck, Database, Building2, Smartphone, Users, AlertTriangle, FileText, Gavel, Layers } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const assumptions = [
    { id: 1, item: 'Reserve compartments and expose reservation/PIN APIs (CHUI / ParcelPoint)', status: 'Unconfirmed' },
    { id: 2, item: 'Utilities, schools, and hospitals offer balance/invoice lookup', status: 'Unconfirmed' },
    { id: 3, item: 'Safaricom product, shortcode type, and onboarding terms for paying institutions', status: 'Unconfirmed' },
    { id: 4, item: 'A gift-card provider covers Kenyan merchants', status: 'Unconfirmed' },
    { id: 5, item: 'Blockchain versus append-only database for the ledger', status: 'Open Decision' },
    { id: 6, item: 'How the system reaches a requester’s phone (PIN delivery, Tier 4 follow-up) given one-way tokens', status: 'Open Decision' },
    { id: 7, item: 'WFP Building Blocks technical details to reuse', status: 'Read Docs First' },
    { id: 8, item: 'Data Protection Act implications for tokenisation and ledger', status: 'Not Yet Reviewed' },
    { id: 9, item: 'AML record-keeping and account-limit requirements for the shortcode holder', status: 'To Confirm' },
  ];

  const dataRules = [
    { stored: 'Token (keyed hash)', not: 'Name' },
    { stored: 'Request category, amount, timestamp', not: 'Residential address' },
    { stored: 'Fulfilment status', not: 'Diagnosis or clinical detail' },
    { stored: 'Keyed hash of object ID', not: 'Raw national ID (beyond derivation)' },
    { stored: 'Aggregate non-identifying counts', not: 'Donor-to-recipient linkage' },
  ];

  const phases = [
    { n: 1, name: 'Nairobi Pilot', items: ['Swap via reserved locker capacity', 'Pool limited to bill & fee payments', 'Deduplication in conventional DB', 'Blind-pooled intake + 1 small campaign'] },
    { n: 2, name: 'Nairobi Scale', items: ['Ledger layer (Section 8 decision)', 'Pool extended to general cash', 'The Match enabled', 'The Bench as standalone system'] },
    { n: 3, name: 'Kenyan Secondary Cities', items: ['Replicate locker/utility/school integrations', 'Adapt per-city partners'] },
    { n: 4, name: 'East Africa', items: ['Re-map payment & locker per country', 'Do not assume Kenyan partners transfer'] },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE8E0] text-[#1F6B4A] text-xs font-medium"><Workflow className="w-3.5 h-3.5" /><span>System Topology & Design Decisions</span></div>
        <h1 className="font-serif text-3xl font-bold text-[#111111]">Architecture & Assumptions</h1>
        <p className="text-sm text-[#111111]/70 max-w-2xl leading-relaxed">Data flow, cryptographic boundaries, data handling rules, regulatory constraints, and open partner assumptions.</p>
      </div>

      {/* PIPELINE */}
      <div className="p-6 bg-white border border-[#111111]/15 rounded-2xl space-y-6">
        <div className="flex justify-between pb-3 border-b border-[#111111]/10"><h2 className="font-serif text-lg font-bold text-[#111111]">End-to-End System Topology</h2><span className="text-xs font-mono text-[#1F6B4A] bg-[#DCE8E0]/70 px-2.5 py-0.5 rounded">Cryptographic Boundary</span></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {[
            { step: '1. Entry', title: 'Intake', body: 'Web / SMS / USSD. Low-bandwidth ready.', foot: 'Anonymous entry' },
            { step: '2. Anonymise', title: 'Tokenising Gateway', body: 'HMAC SHA-256 with weekly rotating salt.', foot: 'Zero-knowledge token', hl: true },
            { step: '3. Route', title: 'Swap vs Pool', body: 'Swap reserves locker; Pool queries institution.', foot: 'Direct settlement' },
            { step: '4. Execute', title: 'Payment Partner', body: 'PIN / institutional settlement. No cash.', foot: 'Separate entity' },
            { step: '5. Govern', title: 'Ledger & Fraud', body: 'Tiers 1-4, hashed dedup, audit log.', foot: 'Structured oversight' },
          ].map(node => (
            <div key={node.step} className={'p-4 rounded-xl bg-[#FAF8F4] space-y-2 ' + (node.hl ? 'border-2 border-[#1F6B4A]' : 'border border-[#111111]/15')}>
              <div><span className="text-[10px] font-mono text-[#1F6B4A] uppercase font-bold">{node.step}</span><h3 className="font-serif text-sm font-bold text-[#111111] mt-1">{node.title}</h3><p className="text-[11px] text-[#111111]/70 mt-1 leading-relaxed">{node.body}</p></div>
              <div className={'pt-2 border-t border-[#111111]/10 font-mono text-[10px] ' + (node.hl ? 'text-[#1F6B4A] font-semibold' : 'text-[#111111]/60')}>{node.foot}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[#F6F4EE] border-2 border-dashed border-[#1F6B4A]/40 space-y-2"><div className="flex items-center gap-2 font-semibold text-[#111111]"><Building2 className="w-4 h-4 text-[#1F6B4A]" /> Payment Partner</div><p className="text-[11px] text-[#111111]/70">Licensed M-Pesa shortcode. LumiereCore holds zero funds.</p><div className="text-[10px] font-mono text-[#111111]/50">Separate legal entity</div></div>
          <div className="p-4 rounded-xl bg-[#FAF8F4] border-2 border-dashed border-amber-600/40 space-y-2"><div className="flex items-center gap-2 font-semibold text-[#111111]"><Smartphone className="w-4 h-4 text-amber-700" /> Messaging Store</div><p className="text-[11px] text-[#111111]/70">Encrypted phone numbers for PIN delivery. Automated access only.</p><div className="text-[10px] font-mono text-[#111111]/50">Isolated store</div></div>
          <div className="p-4 rounded-xl bg-[#F6F4EE] border border-[#111111]/15 space-y-2"><div className="flex items-center gap-2 font-semibold text-[#111111]"><Database className="w-4 h-4 text-blue-600" /> Ledger</div><p className="text-[11px] text-[#111111]/70">Keyed hash of object ID. Cross-funder deduplication.</p><div className="text-[10px] font-mono text-[#111111]/50">Append-only</div></div>
          <div className="p-4 rounded-xl bg-[#F6F4EE] border border-[#111111]/15 space-y-2"><div className="flex items-center gap-2 font-semibold text-[#111111]"><Users className="w-4 h-4 text-rose-500" /> The Bench</div><p className="text-[11px] text-[#111111]/70">Separate infrastructure. Zero shared identifiers.</p><div className="text-[10px] font-mono text-[#111111]/50">Phase 2 · isolated</div></div>
        </div>
      </div>

      {/* DATA RULES */}
      <div className="p-6 bg-white border border-[#111111]/15 rounded-2xl space-y-4">
        <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#1F6B4A]" /><h2 className="font-serif text-lg font-bold text-[#111111]">Data Handling Rules (Section 5)</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <h4 className="text-[10px] font-mono uppercase font-bold text-emerald-900 mb-2">Stored</h4>
            {dataRules.map(r => <div key={r.stored} className="py-1 border-b border-emerald-200/60 last:border-0 text-emerald-950">• {r.stored}</div>)}
          </div>
          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl">
            <h4 className="text-[10px] font-mono uppercase font-bold text-rose-900 mb-2">Never stored</h4>
            {dataRules.map(r => <div key={r.not} className="py-1 border-b border-rose-200/60 last:border-0 text-rose-950">× {r.not}</div>)}
          </div>
        </div>
      </div>

      {/* REGULATORY */}
      <div className="p-6 bg-white border border-[#111111]/15 rounded-2xl space-y-3">
        <div className="flex items-center gap-2"><Gavel className="w-4 h-4 text-[#1F6B4A]" /><h2 className="font-serif text-lg font-bold text-[#111111]">Regulatory Constraints (Section 6)</h2></div>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><strong className="text-amber-900">POCAMLA (AML):</strong> the shortcode holder is a reporting entity. Transaction-monitoring and suspicious-activity reporting duties. Exact record requirements: <em>to confirm with counsel</em>.</div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><strong className="text-blue-900">CBK mobile-money guidelines:</strong> daily turnover thresholds (KShs 100,000) may apply to pooled accounts. Application to pooled disbursement: <em>unconfirmed</em>.</div>
          <div className="p-3 bg-[#FAF8F4] border border-[#111111]/15 rounded-lg"><strong className="text-[#111111]">Design consequence:</strong> LumiereCore’s own accounts do not hold or move Pool funds.</div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg"><strong className="text-rose-900">Data Protection Act:</strong> tokenisation and ledger implications <em>not yet reviewed</em>. Recommend independent privacy review before Phase 1 pilot.</div>
        </div>
      </div>

      {/* PHASES */}
      <div className="p-6 bg-white border border-[#111111]/15 rounded-2xl space-y-4">
        <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-[#1F6B4A]" /><h2 className="font-serif text-lg font-bold text-[#111111]">Build Phasing (Section 7)</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {phases.map(p => (
            <div key={p.n} className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2"><span className="text-[10px] font-mono bg-[#1F6B4A] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold">{p.n}</span><span className="font-bold text-[11px] text-[#111111]">{p.name}</span></div>
              <ul className="space-y-1 text-[10px] text-[#111111]/70">{p.items.map(i => <li key={i} className="flex gap-1"><span className="text-[#1F6B4A]">›</span>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      {/* ASSUMPTIONS */}
      <div className="space-y-3">
        <div className="flex justify-between items-center"><h2 className="font-serif text-xl font-bold text-[#111111]">Open Assumptions (Section 8)</h2><span className="text-xs font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded">9 Hypotheses</span></div>
        <div className="bg-white border border-[#111111]/15 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 font-mono text-[10px] text-[#111111]/60 uppercase"><tr><th className="py-2.5 px-4 w-8">#</th><th className="py-2.5 px-4">Unverified Assumption</th><th className="py-2.5 px-4 text-right">Status</th></tr></thead>
            <tbody className="divide-y divide-[#111111]/5">
              {assumptions.map(a => (
                <tr key={a.id} className="hover:bg-[#FAF8F4]/50">
                  <td className="py-3 px-4 font-mono text-[#111111]/50">{a.id}</td>
                  <td className="py-3 px-4 text-[#111111]">{a.item}</td>
                  <td className="py-3 px-4 text-right"><span className={'px-2 py-0.5 rounded text-[10px] font-mono uppercase border ' + (a.status === 'Unconfirmed' ? 'bg-rose-50 text-rose-800 border-rose-200' : a.status === 'Open Decision' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-amber-50 text-amber-800 border-amber-200')}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* THREAT MODEL */}
      <div className="p-5 bg-white border border-[#111111]/15 rounded-2xl space-y-2 text-xs">
        <h3 className="font-serif text-sm font-bold text-[#111111]">Coverage Snapshot</h3>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg"><div className="text-[9px] font-mono uppercase text-emerald-900 font-bold">Built & functional</div><div className="text-[10px] text-emerald-900/80 mt-1 leading-relaxed">Tokenisation · rate limits · Swap · Pool · Tiers · Audit · OCR · Vouchers · Bench · Donor · Console · CSV export</div></div>
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg"><div className="text-[9px] font-mono uppercase text-amber-900 font-bold">Mocked (interfaces clean)</div><div className="text-[10px] text-amber-900/80 mt-1 leading-relaxed">M-Pesa STK · CHUI lockers · utility lookup · OCR pipeline · staff IdP · Meta WhatsApp</div></div>
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg"><div className="text-[9px] font-mono uppercase text-rose-900 font-bold">Not built (disclosed)</div><div className="text-[10px] text-rose-900/80 mt-1 leading-relaxed">Real ledger (Phase 2) · ML fraud model · DPA review · production Bench infra · CBK threshold tracking</div></div>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg"><div className="text-[9px] font-mono uppercase text-blue-900 font-bold">Structural tension</div><div className="text-[10px] text-blue-900/80 mt-1 leading-relaxed">Proof-of-delivery to donors cannot exist without breaking blind pooling. Disclosed in Donor Impact tab.</div></div>
        </div>
      </div>

      <div className="p-5 bg-white border border-[#111111]/15 rounded-2xl space-y-2 text-xs text-[#111111]/80 leading-relaxed">
        <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#1F6B4A]" /> Measured Anonymity & Threat Model</h3>
        <p className="font-medium text-[#111111]">No system guarantees zero fraud. We use layered checks and independent review.</p>
        <ul className="list-disc pl-5 space-y-1 text-[#111111]/75">
          <li><strong>Human chain:</strong> requesters are anonymous to donors, caseworkers, drivers, cashiers.</li>
          <li><strong>State & telecom:</strong> anonymity does not extend to telecoms or law enforcement — Kenyan SIMs are National-ID registered.</li>
          <li><strong>Compliance:</strong> direct settlement avoids cash handling; the shortcode holder carries AML duties under POCAMLA.</li>
        </ul>
      </div>
    </div>
  );
};
