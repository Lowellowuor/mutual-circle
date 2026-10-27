import React from 'react';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { ASSUMPTIONS } from '../data/mock';
import { 
  Building2, 
  Smartphone, 
  HeartHandshake, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Check 
} from 'lucide-react';

export const DocsShell: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white border border-[#111111]/12 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-[#1F6B4A] uppercase font-bold">
            Technical Architecture &amp; Assumptions
          </span>
          <Chip variant="sample" size="xs">Sample data</Chip>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
          Architecture Documentation
        </h1>
        <p className="text-xs text-[#111111]/70">
          WFP Building Blocks adaptation for dignity, non-evaluative resource access, and community partners privacy.
        </p>
      </div>

      {/* Architecture Node Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Node 1: Separate Payment Partner */}
        <Card className="p-4 space-y-2 border-2 border-dashed border-[#1F6B4A]/40 bg-[#FAF8F4]">
          <div className="flex items-center gap-2 font-semibold text-xs text-[#111111]">
            <Building2 className="w-4 h-4 text-[#1F6B4A]" />
            <span>Payment Partner (Separate Entity)</span>
          </div>
          <p className="text-xs text-[#111111]/75 leading-relaxed">
            All Pool disbursements are submitted directly to a licensed payment partner holding the regulated shortcode. <strong>LumiereCore&apos;s own accounts do not hold or move Pool funds.</strong>
          </p>
          <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded inline-block">
            POCAMLA Reporting Shortcode
          </span>
        </Card>

        {/* Node 2: Phone Path Encrypted Store */}
        <Card className="p-4 space-y-2 border-2 border-dashed border-amber-600/40 bg-[#FAF8F4]">
          <div className="flex items-center gap-2 font-semibold text-xs text-[#111111]">
            <Smartphone className="w-4 h-4 text-amber-700" />
            <span>Separate Encrypted Phone Store</span>
          </div>
          <p className="text-xs text-[#111111]/75 leading-relaxed">
            Phone numbers are held in a separate encrypted store (open design decision), accessible exclusively to automated services for PIN delivery. Zero staff access.
          </p>
          <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded inline-block">
            HSM / Automated Only
          </span>
        </Card>

        {/* Node 3: Blind-Pooled Donor Subsystem */}
        <Card className="p-4 space-y-2 border-2 border-dashed border-emerald-600/40 bg-[#FAF8F4]">
          <div className="flex items-center gap-2 font-semibold text-xs text-[#111111]">
            <HeartHandshake className="w-4 h-4 text-[#1F6B4A]" />
            <span>Blind-Pooled Subsystem</span>
          </div>
          <p className="text-xs text-[#111111]/75 leading-relaxed">
            Donor contributions flow into an undifferentiated pool. Decoupled from disbursements: no donor screen or ledger can link a gift to an individual recipient.
          </p>
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded inline-block">
            Decoupled Ledger
          </span>
        </Card>

      </div>

      {/* The Bench Signpost */}
      <Card className="p-4 bg-[#FAF8F4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1F6B4A] shrink-0" />
          <span className="text-[#111111]/80">
            <strong>The Bench (Peer Support Subsystem):</strong> Independent listening space operating on separate infrastructure. Non-conditional access. Signposts to: <span className="font-mono font-bold text-[#111111]">[Helpline numbers supplied by programme team]</span>.
          </span>
        </div>
        <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded shrink-0">
          Non-Conditional
        </span>
      </Card>

      {/* 9 Architectural Assumptions Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#111111]">
            Nine Assumptions &amp; Hypotheses
          </h2>
          <span className="text-xs font-mono text-[#111111]/60">
            None presented as confirmed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#FAF8F4] border-b border-[#111111]/10 uppercase text-[10px] text-[#111111]/60">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Subsystem Component</th>
                <th className="py-2.5 px-3">Working Hypothesis</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/5">
              {ASSUMPTIONS.map(asm => (
                <tr key={asm.id} className="hover:bg-[#FAF8F4]/50">
                  <td className="py-2.5 px-3 font-bold text-[#111111]">{asm.id}</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-[#111111]">{asm.component}</td>
                  <td className="py-2.5 px-3 font-sans text-[#111111]/70 leading-relaxed">{asm.hypothesis}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-800 font-bold border border-neutral-200 whitespace-nowrap">
                      {asm.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};

