import React from 'react';
import { parseReport, ParsedReport, ReportSection, SubSection, TableData, CTAItem } from '../lib/parseReport';

// ─── Inline markdown renderer ────────────────────────────────────────────────

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

// ─── Health score helpers ─────────────────────────────────────────────────────

function extractNumber(cell: string): number | null {
  const match = cell.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function healthBadgeClasses(score: number): string {
  if (score >= 7) return 'badge-green bg-emerald-100 text-emerald-800 border border-emerald-300';
  if (score >= 5) return 'badge-yellow bg-amber-100 text-amber-800 border border-amber-300';
  return 'badge-red bg-red-100 text-red-800 border border-red-300';
}

function daysUrgencyClasses(days: number): string {
  if (days >= 100) return 'days-red bg-red-100 text-red-800 font-bold';
  if (days >= 60) return 'days-yellow bg-amber-100 text-amber-800 font-semibold';
  return 'days-green bg-emerald-100 text-emerald-800';
}

type ColumnType = 'health' | 'days' | 'acv' | 'normal';

function getColumnType(header: string): ColumnType {
  const h = header.toLowerCase();
  if (h.includes('health') || h.includes('score')) return 'health';
  if (h.includes('days')) return 'days';
  if (h.includes('acv')) return 'acv';
  return 'normal';
}

// ─── Section type detection ───────────────────────────────────────────────────

function getSectionVariant(title: string): 'executive' | 'performance' | 'development' | 'deals' | 'ctas' | 'generic' {
  const t = title.toLowerCase();
  if (t.includes('executive')) return 'executive';
  if (t.includes('performance') || t.includes('leader')) return 'performance';
  if (t.includes('development') || t.includes('opportunit')) return 'development';
  if (t.includes('priority') || t.includes('attention') || t.includes('deal')) return 'deals';
  if (t.includes('cta') || (t.includes('weekly') && t.includes('cta'))) return 'ctas';
  return 'generic';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SUBSECTION_STYLES: Record<SubSection['color'], { border: string; bg: string; printClass: string; icon: string; titleColor: string }> = {
  green:   { border: 'border-l-4 border-emerald-500', bg: 'bg-emerald-50',  printClass: 'summary-card-green',   icon: '🟢', titleColor: 'text-emerald-800' },
  yellow:  { border: 'border-l-4 border-amber-400',   bg: 'bg-amber-50',    printClass: 'summary-card-yellow',  icon: '🟡', titleColor: 'text-amber-800'   },
  orange:  { border: 'border-l-4 border-orange-500',  bg: 'bg-orange-50',   printClass: 'summary-card-orange',  icon: '⚡', titleColor: 'text-orange-800'  },
  neutral: { border: 'border-l-4 border-slate-300',   bg: 'bg-slate-50',    printClass: 'summary-card-neutral', icon: '•',  titleColor: 'text-slate-700'   },
};

function ExecutiveSummaryCard({ subsection }: { subsection: SubSection }) {
  const styles = SUBSECTION_STYLES[subsection.color];
  const cleanTitle = subsection.title.replace(/^[🟢🟡⚡]\s*/, '');

  return (
    <div className={`rounded-lg p-5 ${styles.border} ${styles.bg} ${styles.printClass} flex flex-col gap-3`}>
      <h3 className={`font-semibold text-sm uppercase tracking-wide ${styles.titleColor}`}>
        {cleanTitle}
      </h3>
      <ul className="space-y-2">
        {subsection.bullets.map((bullet, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
            <span className="mt-0.5 shrink-0 text-xs">{styles.icon}</span>
            <span>{renderInline(bullet)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StyledTable({ table, variant }: { table: TableData; variant?: string }) {
  const columnTypes = table.headers.map(getColumnType);
  const isDevelopment = variant === 'development';

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className={`table-header-dark ${isDevelopment ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'}`}>
            {table.headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left font-medium tracking-wide text-xs uppercase whitespace-nowrap ${
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
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              {row.map((cell, ci) => {
                const colType = columnTypes[ci] ?? 'normal';

                if (colType === 'health') {
                  const score = extractNumber(cell);
                  return (
                    <td key={ci} className="px-4 py-3">
                      {score !== null ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${healthBadgeClasses(score)}`}>
                          {score}
                        </span>
                      ) : cell}
                    </td>
                  );
                }

                if (colType === 'days') {
                  const days = extractNumber(cell);
                  return (
                    <td key={ci} className="px-4 py-3">
                      {days !== null ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs ${daysUrgencyClasses(days)}`}>
                          {days}d
                        </span>
                      ) : cell}
                    </td>
                  );
                }

                if (colType === 'acv') {
                  return (
                    <td key={ci} className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">
                      {cell}
                    </td>
                  );
                }

                return (
                  <td key={ci} className="px-4 py-3 text-slate-700 leading-relaxed">
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
    <ol className="space-y-4">
      {ctas.map((cta, i) => (
        <li key={i} className="flex gap-4">
          <span className="cta-circle flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 leading-snug">{renderInline(cta.title)}</p>
            {cta.expected && (
              <p className="mt-1.5 text-sm text-slate-500 bg-slate-50 rounded px-3 py-2 border-l-2 border-indigo-300">
                <span className="font-medium text-slate-600">Expected next week: </span>
                {renderInline(cta.expected)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function SectionWrapper({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <section className="space-y-4">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${accent || 'border-indigo-200'}`}>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function renderSection(section: ReportSection) {
  const variant = getSectionVariant(section.title);

  // Executive summary — 3 subsection cards
  if (variant === 'executive' && section.subsections.length > 0) {
    return (
      <SectionWrapper title={section.title} accent="border-slate-300" key={section.id}>
        <div className={`grid gap-4 ${section.subsections.length === 3 ? 'grid-cols-3' : section.subsections.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {section.subsections.map((sub, i) => (
            <ExecutiveSummaryCard key={i} subsection={sub} />
          ))}
        </div>
      </SectionWrapper>
    );
  }

  // Performance leaders
  if (variant === 'performance') {
    return (
      <SectionWrapper title={section.title} accent="border-emerald-300" key={section.id}>
        {section.theme && (
          <p className="text-sm text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 leading-relaxed">
            {renderInline(section.theme)}
          </p>
        )}
        {section.table && <StyledTable table={section.table} variant="performance" />}
      </SectionWrapper>
    );
  }

  // Development opportunities
  if (variant === 'development') {
    return (
      <SectionWrapper title={section.title} accent="border-red-200" key={section.id}>
        {section.theme && (
          <p className="text-sm text-slate-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 leading-relaxed">
            {renderInline(section.theme)}
          </p>
        )}
        {section.table && <StyledTable table={section.table} variant="development" />}
      </SectionWrapper>
    );
  }

  // Priority attention deals
  if (variant === 'deals') {
    return (
      <SectionWrapper title={section.title} accent="border-amber-300" key={section.id}>
        {section.table && <StyledTable table={section.table} variant="deals" />}
      </SectionWrapper>
    );
  }

  // Weekly CTAs
  if (variant === 'ctas' && section.ctas && section.ctas.length > 0) {
    return (
      <SectionWrapper title={section.title} accent="border-indigo-300" key={section.id}>
        <CTAList ctas={section.ctas} />
      </SectionWrapper>
    );
  }

  // Generic fallback — render subsections + table if present
  return (
    <SectionWrapper title={section.title} key={section.id}>
      {section.theme && <p className="text-sm text-slate-600 leading-relaxed">{renderInline(section.theme)}</p>}
      {section.subsections.map((sub, i) => <ExecutiveSummaryCard key={i} subsection={sub} />)}
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
    <div className="bg-slate-100 font-sans">
      {/* Header */}
      <header className="report-header bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-8 py-10">
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{report.title}</h1>
        {report.quote && (
          <p className="mt-4 text-sm text-indigo-200 italic max-w-3xl leading-relaxed">
            &ldquo;{report.quote}&rdquo;
          </p>
        )}
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-8 py-8 space-y-10">
        {report.sections.map(renderSection)}
      </main>
    </div>
  );
};

export default PipelineReport;
