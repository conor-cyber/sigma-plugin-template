import React from 'react';
import { parseReport, ParsedReport, ReportSection, SubSection, TableData, CTAItem } from '../lib/parseReport';

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const B = {
  blue:         '#2563EB',  // Sigma primary blue
  blueDark:     '#1D4ED8',  // hover / emphasis
  blueLight:    '#EFF6FF',  // card bg tint
  blueMid:      '#DBEAFE',  // slightly richer tint
  blueBorder:   '#BFDBFE',  // card border
  blueSubtle:   '#93C5FD',  // muted blue accent
  dark:         '#111827',  // primary text
  mid:          '#374151',  // secondary text
  muted:        '#6B7280',  // tertiary text
  bg:           '#FFFFFF',
  surface:      '#F9FAFB',  // alternating rows
  surfaceMid:   '#F3F4F6',  // hover / zebra
  border:       '#E5E7EB',  // neutral dividers
  borderLight:  '#F0F0F0',
} as const;

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

// ─── Health / days helpers ────────────────────────────────────────────────────

function extractNumber(cell: string): number | null {
  const match = cell.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

type BadgeStyle = { bg: string; color: string; border: string; cssClass: string };

function healthBadge(score: number): BadgeStyle {
  if (score >= 7) return { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', cssClass: 'badge-green' };
  if (score >= 5) return { bg: '#FEF9C3', color: '#854D0E', border: '#FEF08A', cssClass: 'badge-yellow' };
  return { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', cssClass: 'badge-red' };
}

function daysBadge(days: number): BadgeStyle {
  if (days >= 100) return { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', cssClass: 'days-red' };
  if (days >= 60)  return { bg: '#FEF9C3', color: '#854D0E', border: '#FEF08A', cssClass: 'days-yellow' };
  return { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', cssClass: 'days-green' };
}

type ColumnType = 'health' | 'days' | 'acv' | 'normal';

function getColumnType(header: string): ColumnType {
  const h = header.toLowerCase();
  if (h.includes('health') || h.includes('score')) return 'health';
  if (h.includes('days')) return 'days';
  if (h.includes('acv')) return 'acv';
  return 'normal';
}

// ─── Section variant detection ────────────────────────────────────────────────

function getSectionVariant(title: string): 'executive' | 'performance' | 'development' | 'deals' | 'ctas' | 'generic' {
  const t = title.toLowerCase();
  if (t.includes('executive')) return 'executive';
  if (t.includes('performance') || t.includes('leader')) return 'performance';
  if (t.includes('development') || t.includes('opportunit')) return 'development';
  if (t.includes('priority') || t.includes('attention') || t.includes('deal')) return 'deals';
  if (t.includes('cta') || (t.includes('weekly') && t.includes('cta'))) return 'ctas';
  return 'generic';
}

// ─── Executive summary card config ───────────────────────────────────────────

interface CardConfig {
  bg: string;
  leftBorder: string;
  outerBorder: string;
  titleColor: string;
  dotBg: string;
  printClass: string;
}

const CARD_CONFIG: Record<SubSection['color'], CardConfig> = {
  green: {
    bg:          '#F0FDF4',
    leftBorder:  '#16A34A',
    outerBorder: '#BBF7D0',
    titleColor:  '#15803D',
    dotBg:       '#16A34A',
    printClass:  'summary-card-green',
  },
  yellow: {
    bg:          '#FEFCE8',
    leftBorder:  '#CA8A04',
    outerBorder: '#FDE68A',
    titleColor:  '#A16207',
    dotBg:       '#CA8A04',
    printClass:  'summary-card-yellow',
  },
  orange: {
    bg:          '#FFF7ED',
    leftBorder:  '#EA580C',
    outerBorder: '#FED7AA',
    titleColor:  '#C2410C',
    dotBg:       '#EA580C',
    printClass:  'summary-card-orange',
  },
  neutral: {
    bg:          B.blueLight,
    leftBorder:  B.blue,
    outerBorder: B.blueBorder,
    titleColor:  B.blueDark,
    dotBg:       B.blue,
    printClass:  'summary-card-neutral',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExecutiveSummaryCard({ subsection }: { subsection: SubSection }) {
  const cfg = CARD_CONFIG[subsection.color];
  const cleanTitle = subsection.title.replace(/^[🟢🟡⚡🔴]\s*/, '');

  return (
    <div
      className={`rounded-xl p-5 flex flex-col gap-3 ${cfg.printClass}`}
      style={{
        background:     cfg.bg,
        borderTop:    `1px solid ${cfg.outerBorder}`,
        borderRight:  `1px solid ${cfg.outerBorder}`,
        borderBottom: `1px solid ${cfg.outerBorder}`,
        borderLeft:   `4px solid ${cfg.leftBorder}`,
      }}
    >
      <h3
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: cfg.titleColor }}
      >
        {cleanTitle}
      </h3>
      <ul className="space-y-2.5">
        {subsection.bullets.map((bullet, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: B.mid }}>
            <span
              className="shrink-0 mt-0.5 flex items-center justify-center rounded-full text-white"
              style={{
                background: cfg.dotBg,
                width: '16px',
                height: '16px',
                minWidth: '16px',
                minHeight: '16px',
                fontSize: '9px',
                fontWeight: 700,
              }}
            >
              ✓
            </span>
            <span>{renderInline(bullet)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StyledTable({ table }: { table: TableData }) {
  const columnTypes = table.headers.map(getColumnType);

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${B.border}` }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="table-header-sigma" style={{ background: B.blue }}>
            {table.headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-white ${
                  columnTypes[i] === 'acv' ? 'text-right' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? B.bg : B.surfaceMid }}>
              {row.map((cell, ci) => {
                const colType = columnTypes[ci] ?? 'normal';

                if (colType === 'health') {
                  const score = extractNumber(cell);
                  const badge = score !== null ? healthBadge(score) : null;
                  return (
                    <td key={ci} className="px-4 py-3">
                      {badge ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.cssClass}`}
                          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                        >
                          {score}
                        </span>
                      ) : cell}
                    </td>
                  );
                }

                if (colType === 'days') {
                  const days = extractNumber(cell);
                  const badge = days !== null ? daysBadge(days) : null;
                  return (
                    <td key={ci} className="px-4 py-3">
                      {badge ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${badge.cssClass}`}
                          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                        >
                          {days}d
                        </span>
                      ) : cell}
                    </td>
                  );
                }

                if (colType === 'acv') {
                  return (
                    <td key={ci} className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: B.dark }}>
                      {cell}
                    </td>
                  );
                }

                return (
                  <td key={ci} className="px-4 py-3 leading-relaxed" style={{ color: B.mid }}>
                    {renderInline(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CTAList({ ctas }: { ctas: CTAItem[] }) {
  return (
    <ol className="space-y-5">
      {ctas.map((cta, i) => (
        <li key={i} className="flex gap-4">
          <span
            className="cta-circle flex-shrink-0 flex items-center justify-center rounded-full text-sm font-bold text-white"
            style={{
              background:  B.blue,
              width:       '32px',
              height:      '32px',
              minWidth:    '32px',
              minHeight:   '32px',
              marginTop:   '2px',
            }}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-snug" style={{ color: B.dark }}>
              {renderInline(cta.title)}
            </p>
            {cta.expected && (
              <p
                className="mt-2 text-sm leading-relaxed rounded-lg px-4 py-2.5"
                style={{
                  color:       B.muted,
                  background:  B.blueLight,
                  borderLeft:  `3px solid ${B.blueBorder}`,
                }}
              >
                <span className="font-semibold" style={{ color: B.blueDark }}>
                  Expected next week:{' '}
                </span>
                {renderInline(cta.expected)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionWrapper({
  title,
  label,
  children,
}: {
  title: string;
  label?: string;
  children: React.ReactNode;
}) {
  const cleanTitle = title.replace(/^[📊🏆🎯🚨⚡]\s*/, '');

  return (
    <section className="space-y-4">
      <div className="pb-3" style={{ borderBottom: `2px solid ${B.blue}` }}>
        {label && (
          <p
            className="text-xs font-bold uppercase tracking-widest mb-0.5"
            style={{ color: B.blue }}
          >
            {label}
          </p>
        )}
        <h2 className="text-xl font-bold" style={{ color: B.dark }}>
          {cleanTitle}
        </h2>
      </div>
      {children}
    </section>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function renderSection(section: ReportSection) {
  const variant = getSectionVariant(section.title);

  // ── Executive summary ────────────────────────────────
  if (variant === 'executive' && section.subsections.length > 0) {
    return (
      <SectionWrapper title={section.title} label="Pipeline Overview" key={section.id}>
        <div
          className={`grid gap-4 ${
            section.subsections.length === 3
              ? 'grid-cols-3'
              : section.subsections.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {section.subsections.map((sub, i) => (
            <ExecutiveSummaryCard key={i} subsection={sub} />
          ))}
        </div>
      </SectionWrapper>
    );
  }

  // ── Performance leaders ──────────────────────────────
  if (variant === 'performance') {
    return (
      <SectionWrapper title={section.title} label="Top Performers" key={section.id}>
        {section.theme && (
          <p
            className="text-sm leading-relaxed rounded-xl px-4 py-3"
            style={{
              color:      B.mid,
              background: B.blueLight,
              borderLeft: `4px solid ${B.blue}`,
            }}
          >
            {renderInline(section.theme)}
          </p>
        )}
        {section.table && <StyledTable table={section.table} />}
      </SectionWrapper>
    );
  }

  // ── Development opportunities ────────────────────────
  if (variant === 'development') {
    return (
      <SectionWrapper title={section.title} label="Coaching Required" key={section.id}>
        {section.theme && (
          <p
            className="text-sm leading-relaxed rounded-xl px-4 py-3"
            style={{
              color:      B.mid,
              background: '#FFF7ED',
              borderLeft: '4px solid #EA580C',
            }}
          >
            {renderInline(section.theme)}
          </p>
        )}
        {section.table && <StyledTable table={section.table} />}
      </SectionWrapper>
    );
  }

  // ── Priority deals ───────────────────────────────────
  if (variant === 'deals') {
    return (
      <SectionWrapper title={section.title} label="Requires Attention" key={section.id}>
        {section.table && <StyledTable table={section.table} />}
      </SectionWrapper>
    );
  }

  // ── Weekly CTAs ──────────────────────────────────────
  if (variant === 'ctas' && section.ctas && section.ctas.length > 0) {
    return (
      <SectionWrapper title={section.title} label="Actions This Week" key={section.id}>
        <CTAList ctas={section.ctas} />
      </SectionWrapper>
    );
  }

  // ── Generic fallback ─────────────────────────────────
  return (
    <SectionWrapper title={section.title} key={section.id}>
      {section.theme && (
        <p className="text-sm leading-relaxed" style={{ color: B.muted }}>
          {renderInline(section.theme)}
        </p>
      )}
      {section.subsections.map((sub, i) => (
        <ExecutiveSummaryCard key={i} subsection={sub} />
      ))}
      {section.table && <StyledTable table={section.table} />}
    </SectionWrapper>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PipelineReportProps {
  markdown: string;
}

const PipelineReport: React.FC<PipelineReportProps> = ({ markdown }) => {
  const report: ParsedReport = parseReport(markdown);

  return (
    <div className="font-sans" style={{ minWidth: '960px', background: B.bg }}>

      {/* ── Header ── */}
      <header className="report-header px-10 py-10" style={{ background: B.blue }}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {/* Sigma wordmark pill */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}
              >
                Sigma
              </span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Pipeline Intelligence
              </span>
            </div>

            <h1
              className="leading-tight text-white"
              style={{ fontSize: '26px', fontFamily: '"DM Serif Display", Georgia, serif', maxWidth: '700px' }}
            >
              {report.title}
            </h1>

            {report.quote && (
              <p
                className="mt-4 text-sm italic leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '640px' }}
              >
                &ldquo;{report.quote}&rdquo;
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main
        className="mx-auto px-8 py-8 space-y-10"
        style={{ maxWidth: '1280px' }}
      >
        {report.sections.map(renderSection)}
      </main>

    </div>
  );
};

export default PipelineReport;
