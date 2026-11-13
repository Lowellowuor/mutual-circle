import { ScreenHeader } from '../../ui';
import React from 'react';
import { TrendingUp, ChevronRight, ShieldCheck } from 'lucide-react';
import { DonutChart } from '../ui/DonutChart';
import { BarChart } from '../ui/BarChart';

interface ImpactStats {
  total_pooled_pence: number;
  bundles_delivered: number;
  utility_meters_paid: number;
  student_terms_paid: number;
}

interface DistributionItem {
  category: string;
  label: string;
  count: number;
  total_pence: number;
  percentage: number;
}

interface DonorContribution {
  id: string;
  amount: number;
  timestamp: string;
}

interface DonorImpactProps {
  impactStats: ImpactStats | null;
  distribution: DistributionItem[];
  donorContributions: DonorContribution[];
  openLedgerModal: () => void;
}

const SEGMENTS = [
  { id: 'all', label: 'All time' },
  { id: 'six', label: '6 months' },
  { id: 'month', label: 'This month' },
] as const;

type Segment = typeof SEGMENTS[number]['id'];

const DONUT_COLORS = [
  'stroke-pine',
  'stroke-green-ramp',
  'stroke-green-ramp-light',
  'stroke-lime',
  'stroke-tile',
];

export const DonorImpact: React.FC<DonorImpactProps> = (props) => {
  const [segment, setSegment] = React.useState<Segment>('all');

  // Filter contributions by selected timeframe
  const cutoff = (() => {
    const now = Date.now();
    if (segment === 'month') return now - 30 * 24 * 60 * 60 * 1000;
    if (segment === 'six') return now - 180 * 24 * 60 * 60 * 1000;
    return 0;
  })();

  const filteredContribs = props.donorContributions.filter(
    c => new Date(c.timestamp).getTime() >= cutoff
  );

  // Build 6-month bar chart series
  const barData = React.useMemo(() => {
    const buckets: { month: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en', { month: 'short' });
      const monthStart = d.getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
      const sum = props.donorContributions
        .filter(c => {
          const t = new Date(c.timestamp).getTime();
          return t >= monthStart && t <= monthEnd;
        })
        .reduce((a, c) => a + c.amount, 0);
      buckets.push({ month: label, value: sum });
    }
    return buckets;
  }, [props.donorContributions]);

  // Donut segments from distribution (only those with count >= 3 — R.U.T.H minimum group size)
  const donutSegments = props.distribution
    .filter(d => d.count >= 3 || d.count === 0)
    .map((d, i) => ({
      label: d.label,
      value: d.count || d.total_pence,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))
    .filter(s => s.value > 0);

  const totalGiven = filteredContribs.reduce((a, c) => a + c.amount, 0);

  return (
    <div className="space-y-6">
      <ScreenHeader number="03" eyebrow="Transparency" title="Impact" subtitle="Aggregate. Never individual." />
      {/* Header */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={props.openLedgerModal}
          className="p-2 rounded-full hover:bg-tint transition-colors bg-surface border border-tile shadow-sm"
          aria-label="Verify ledger"
        >
          <ShieldCheck className="w-5 h-5 text-pine" />
        </button>
      </div>

      {/* Segmented pill tabs */}
      <div className="inline-flex bg-canvas border border-tile rounded-full p-1">
        {SEGMENTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSegment(s.id)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
              segment === s.id ? 'bg-pine text-white shadow-soft' : 'text-muted hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Summary card */}
      <div className="card-editorial p-5 md:p-6 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-white/60 font-semibold">Total given</span>
          <TrendingUp className="w-5 h-5 text-lime" />
        </div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-white/60">KES</span>
          <span className="text-3xl font-bold tabular-nums">{totalGiven.toLocaleString()}</span>
        </div>
        <p className="text-sm text-white/70 mt-2">
          {filteredContribs.length} gift{filteredContribs.length !== 1 ? 's' : ''} in this period
        </p>
      </div>

      {/* Donut chart — category breakdown */}
      <div className="card-editorial p-5 md:p-6 mb-4">
        <h3 className="text-sm font-semibold text-ink mb-4">Where it went</h3>
        {donutSegments.length > 0 ? (
          <DonutChart segments={donutSegments} minGroupSizePct={5} />
        ) : (
          <div className="text-sm text-muted text-center py-8">
            No category data yet. Give to a category to see the breakdown.
          </div>
        )}
      </div>

      {/* Bar chart — 6-month trend */}
      <div className="card-editorial p-5 md:p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">Your last 6 months</h3>
        </div>
        <BarChart data={barData} height={140} />
      </div>

      {/* Insight banner */}
      <div className="card-editorial p-5 md:p-6 mb-4">
        <div>
          <p className="text-sm font-semibold text-pine-deep">Small group sizes are hidden</p>
          <p className="text-xs text-pine-deep/70 mt-1">
            Categories with fewer than 5% of total are aggregated to protect anonymity.
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-pine shrink-0" />
      </div>

      {/* CTA back to give */}
      <button className="btn btn-primary w-full mb-3">
        Support another category
      </button>
    </div>
  );
};