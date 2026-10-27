import React from 'react';
import { SIMULATED_ASSUMPTIONS } from '../../mockData';
import { 
  Workflow, 
  ShieldCheck, 
  Database, 
  Smartphone, 
  HeartHandshake, 
  Users, 
  Lock, 
  ArrowRight, 
  AlertTriangle,
  FileCheck,
  Building2,
  KeyRound,
  Layers
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE8E0] text-[#1F6B4A] text-xs font-medium">
          <Workflow className="w-3.5 h-3.5" />
          <span>System Topology &amp; Design Decisions</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#111111]">
          Architecture &amp; Assumptions
        </h1>
        <p className="text-xs sm:text-sm text-[#111111]/70 max-w-2xl leading-relaxed">
          Comprehensive data flow diagram, cryptographic boundaries, and status of external partner assumptions simulated in this prototype.
        </p>
      </div>

      {/* Visual Interactive Architecture Diagram */}
      <div className="p-6 rounded-2xl bg-white border border-[#111111]/15 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#111111]/10">
          <h2 className="font-serif text-lg font-bold text-[#111111]">
            End-to-End System Topology
          </h2>
          <span className="text-xs font-mono text-[#1F6B4A] bg-[#DCE8E0]/70 px-2.5 py-0.5 rounded">
            Cryptographic Boundary Enforced
          </span>
        </div>

        {/* The Main Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          
          {/* Node 1: Channels */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#1F6B4A] uppercase font-bold">1. Entry Channels</span>
              <h3 className="font-serif text-sm font-bold text-[#111111]">Requester Intake</h3>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Web App, SMS shortcode ([Placeholder SMS shortcode]), or USSD session ([Placeholder USSD code]).
              </p>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
              Low-bandwidth ready
            </div>
          </div>

          {/* Node 2: Tokenising Gateway */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border-2 border-[#1F6B4A] space-y-2 flex flex-col justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#1F6B4A] uppercase font-bold">2. Anonymisation</span>
              <h3 className="font-serif text-sm font-bold text-[#111111]">Tokenising Gateway</h3>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Derived as a private, keyed one-way token. Names &amp; MSISDN discarded.
              </p>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#1F6B4A] font-semibold">
              Zero-knowledge token
            </div>
          </div>

          {/* Node 3: Routing (Swap or Pool) */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#1F6B4A] uppercase font-bold">3. Resource Split</span>
              <h3 className="font-serif text-sm font-bold text-[#111111]">The Swap vs The Pool</h3>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                The Swap reserves smart locker box; The Pool queries institutional meters.
              </p>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
              Direct settlement only
            </div>
          </div>

          {/* Node 4: Settlement Execution */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#1F6B4A] uppercase font-bold">4. Execution</span>
              <h3 className="font-serif text-sm font-bold text-[#111111]">PIN / Payment Partner</h3>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Single-use PIN sent via blind SMS; utility &amp; tuition submitted to payment partner.
              </p>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
              No cash sent to phone
            </div>
          </div>

          {/* Node 5: Verification & Fraud */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/15 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#1F6B4A] uppercase font-bold">5. Governance</span>
              <h3 className="font-serif text-sm font-bold text-[#111111]">Tiers &amp; Deduplication</h3>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                Tiers 1–4, hashed object deduplication (obj #...), and strict separation of duties.
              </p>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
              Audit log enforced
            </div>
          </div>

        </div>

        {/* Separated External Sub-Systems & Isolated Architecture Boxes */}
        <div className="pt-4 border-t border-[#111111]/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Box 1: Payment Partner (Pass 1 #6 & Pass 2 #6a) */}
          <div className="p-4 rounded-xl bg-[#F6F4EE] border-2 border-dashed border-[#1F6B4A]/40 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-[#111111]">
                  <Building2 className="w-4 h-4 text-[#1F6B4A]" />
                  <span>Payment partner / M-Pesa shortcode holder (separate entity)</span>
                </div>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded shrink-0">
                  Separate Entity
                </span>
              </div>
              <p className="text-[11px] text-[#111111]/80 leading-relaxed font-semibold">
                LumiereCore&apos;s own accounts do not hold or move Pool funds.
              </p>
              <p className="text-[11px] text-[#111111]/70 leading-relaxed">
                All disbursements for KPLC electricity tokens, Nairobi water accounts, hospital bills, and school tuition are submitted directly to a licensed payment partner holding the regulated shortcode.
              </p>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
              Zero fund custody by LumiereCore
            </div>
          </div>

          {/* Box 2: Messaging Component Sub-Diagram (Pass 2 #6b) */}
          <div className="p-4 rounded-xl bg-[#FAF8F4] border-2 border-dashed border-amber-600/40 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-[#111111]">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>Messaging Component: Phone Store</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded shrink-0">
                  Isolated Store
                </span>
              </div>
              <p className="text-[11px] text-[#111111]/80 leading-relaxed">
                <strong>Messaging component:</strong> phone number held in a separate encrypted store (open design decision), accessible only to automated processes (PIN delivery, Tier 4 follow-up) or via requester-initiated contact.
              </p>
              <div className="p-2 rounded bg-amber-50/80 border border-amber-200/60 font-mono text-[10px] text-amber-900 space-y-1">
                <div>Status: open design decision (HSM enclave vs secure blind gateway).</div>
                <div className="pt-1 border-t border-amber-200/60 text-[9px] text-rose-900 font-sans">
                  <strong>Design note (for security review):</strong> When SMS delivery fails, the PIN is shown on screen as a fallback.
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
              Staff have zero phone access
            </div>
          </div>

          {/* Box 3: Donor Intake Subsystem (Decoupled) */}
          <div className="p-4 rounded-xl bg-[#F6F4EE] border border-[#111111]/15 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-[#111111]">
                  <HeartHandshake className="w-4 h-4 text-[#1F6B4A]" />
                  <span>Donor Intake Subsystem</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                  Blind-Pooled
                </span>
              </div>
              <p className="text-[11px] text-[#111111]/75 leading-relaxed">
                Accepts contributions into an undifferentiated pool. <strong>Architecturally decoupled from disbursements.</strong> No donor screen or ledger possesses visibility into individual recipient allocations.
              </p>
            </div>
            <div className="pt-2 border-t border-[#111111]/10 font-mono text-[10px] text-[#111111]/60">
              No donor-recipient linkage
            </div>
          </div>

        </div>

        {/* The Bench Subsystem */}
        <div className="pt-2 border-t border-[#111111]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1F6B4A] shrink-0" />
            <span className="text-[#111111]/80">
              <strong>The Bench (Peer Support Subsystem):</strong> Independent confidential listening space operating on completely separate infrastructure. Non-conditional access. Signposts to: <span className="font-mono text-[#111111] font-semibold">[Helpline numbers supplied by programme team]</span>.
            </span>
          </div>
          <span className="text-[10px] font-mono bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded shrink-0">
            Phase 2 Separate System
          </span>
        </div>

      </div>

      {/* Mandatory Assumptions Table (9 Exact Rows) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#111111]">
              Simulated in this Prototype (Assumptions &amp; Hypotheses)
            </h2>
            <p className="text-xs text-[#111111]/70 mt-0.5">
              Unverified technical and legal hypotheses currently operating on simulated mock parameters.
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded self-start sm:self-auto">
            9 Unconfirmed / Open Decision Hypotheses
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#111111]/15 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 font-mono text-[11px] text-[#111111]/60 uppercase">
                <tr>
                  <th className="py-3 px-4">System Component</th>
                  <th className="py-3 px-4">Unverified Hypothesis</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Architectural Mitigation</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/5">
                {SIMULATED_ASSUMPTIONS.map(asm => (
                  <tr key={asm.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#111111] whitespace-nowrap">
                      {asm.component}
                    </td>
                    <td className="py-3 px-4 text-[#111111]/80 max-w-sm leading-relaxed">
                      {asm.hypothesis}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        asm.risk === 'High' ? 'bg-rose-100 text-rose-800' :
                        asm.risk === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {asm.risk}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#111111]/70 text-[11px] max-w-xs leading-relaxed">
                      {asm.mitigation}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase border ${
                        asm.status === 'Open decision'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : asm.status === 'Not yet reviewed'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : asm.status === 'To confirm with counsel'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                          : asm.status === 'To verify'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {asm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Measured Security & Plain-Language Anonymity Note */}
      <div className="p-5 rounded-2xl bg-white border border-[#111111]/15 space-y-2 text-xs text-[#111111]/80 leading-relaxed">
        <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#1F6B4A]" />
          <span>Measured Anonymity &amp; Realistic Threat Modeling</span>
        </h3>
        <p className="font-medium text-[#111111]">
          No system can guarantee zero fraud. We use layered checks and independent review.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[#111111]/75">
          <li>
            <strong>Human Chain Anonymity:</strong> Requesters are genuinely anonymous from donors, caseworkers, delivery drivers, and retail/hospital cashiers.
          </li>
          <li>
            <strong>State &amp; Telecom Boundary:</strong> Anonymity does not extend to telecoms or statutory law enforcement: M-Pesa SIM cards in Kenya are legally registered to National ID cards under the Kenya Information and Communications (Registration of SIM-cards) Regulations.
          </li>
          <li>
            <strong>Financial Compliance:</strong> By settling utilities, water, and school fees directly via institution-payment products, the network avoids holding or transmitting cash to recipients, reducing AML and custodial risk. The M-Pesa shortcode holder is expected to carry AML reporting duties under POCAMLA.
          </li>
        </ul>
      </div>

    </div>
  );
};

