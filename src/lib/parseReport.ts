export interface SubSection {
  title: string;
  color: 'green' | 'yellow' | 'orange' | 'neutral';
  bullets: string[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface CTAItem {
  title: string;
  expected?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  theme?: string;
  subsections: SubSection[];
  table?: TableData;
  ctas?: CTAItem[];
}

export interface ParsedReport {
  title: string;
  quote: string;
  sections: ReportSection[];
}

function parseTableRow(line: string): string[] {
  const parts = line.split('|').map(c => c.trim());
  if (parts.length === 0) return [];
  const start = parts[0] === '' ? 1 : 0;
  const end = parts[parts.length - 1] === '' ? parts.length - 1 : parts.length;
  return parts.slice(start, end);
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every(c => /^[-: ]+$/.test(c));
}

function parseTable(sectionLines: string[]): TableData | undefined {
  const tableLines = sectionLines.filter(l => l.trim().startsWith('|'));
  if (tableLines.length < 2) return undefined;

  const headerCells = parseTableRow(tableLines[0]);
  if (headerCells.length === 0) return undefined;

  let dataStart = 1;
  if (tableLines.length > 1 && isSeparatorRow(parseTableRow(tableLines[1]))) {
    dataStart = 2;
  }

  const rows = tableLines
    .slice(dataStart)
    .map(parseTableRow)
    .filter(row => row.length > 0 && !isSeparatorRow(row));

  return { headers: headerCells, rows };
}

function subSectionColor(title: string): SubSection['color'] {
  if (title.includes('🟢') || title.toLowerCase().includes('working')) return 'green';
  if (title.includes('🟡') || title.toLowerCase().includes('friction')) return 'yellow';
  if (title.includes('⚡') || title.toLowerCase().includes('action')) return 'orange';
  return 'neutral';
}

function parseCTAs(lines: string[]): CTAItem[] {
  const ctas: CTAItem[] = [];
  let current: CTAItem | null = null;

  for (const line of lines) {
    // Capture full title after "N. " so **bold** and mixed markdown don't break on .+? / optional * edge cases
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (current) ctas.push(current);
      current = { title: orderedMatch[1].trim() };
    } else if (current && line.toLowerCase().includes('expected')) {
      current.expected = line
        .replace(/^\s*[-*]\s*/, '')
        .replace(/\*?Expected Next Week:\*?\s*/i, '')
        .trim();
    }
  }
  if (current) ctas.push(current);
  return ctas;
}

// Subsection header patterns the Sigma agent may produce:
// 1. ### 🟢 What's Working
// 2. **🟢 What's Working** (bold standalone line)
// 3. 🟢 What's Working (plain emoji-prefixed line)
const SECTION_EMOJI_RE = /^[🟢🟡⚡🔴🏆🎯🚨📊]/u;

function isSubsectionHeader(line: string): boolean {
  const t = line.trim();
  if (t.startsWith('### ')) return true;
  // Bold standalone line: **...**
  if (/^\*\*[^*]+\*\*$/.test(t)) return true;
  // Short emoji-prefixed line (not a bullet, not a table row)
  if (SECTION_EMOJI_RE.test(t) && !t.startsWith('-') && !t.startsWith('|') && t.length < 80) return true;
  return false;
}

function cleanSubsectionTitle(line: string): string {
  return line.trim()
    .replace(/^### /, '')
    .replace(/^\*\*/, '').replace(/\*\*$/, '')
    .trim();
}

function parseSectionContent(lines: string[]): Pick<ReportSection, 'theme' | 'subsections' | 'table'> {
  const subsections: SubSection[] = [];
  let theme: string | undefined;
  let currentSubsection: SubSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isSubsectionHeader(trimmed)) {
      if (currentSubsection) subsections.push(currentSubsection);
      const title = cleanSubsectionTitle(trimmed);
      currentSubsection = { title, color: subSectionColor(title), bullets: [] };
    } else if (trimmed.match(/^[-*] /)) {
      const bullet = trimmed.replace(/^[-*] /, '');
      if (currentSubsection) {
        currentSubsection.bullets.push(bullet);
      }
    } else if (trimmed.startsWith('**Overall')) {
      theme = trimmed;
    } else if (currentSubsection && !trimmed.startsWith('|')) {
      // Plain paragraph within a subsection — treat as a bullet
      currentSubsection.bullets.push(trimmed);
    }
  }
  if (currentSubsection) subsections.push(currentSubsection);

  const table = parseTable(lines);
  return { theme, subsections, table };
}

export function parseReport(markdown: string): ParsedReport {
  const lines = markdown.split('\n').map(l => l.trimEnd());

  // Extract title from first H1
  const titleLine = lines.find(l => l.startsWith('# ')) || lines.find(l => l.trim().length > 0) || '';
  const title = titleLine.replace(/^# /, '').trim();

  // Extract quote — line starting with " or *" that isn't a header
  const quoteLine = lines.find(l => {
    const t = l.trim();
    return (t.startsWith('"') || t.startsWith('*"') || t.startsWith('> ')) && !l.startsWith('#');
  }) || '';
  const quote = quoteLine
    .replace(/^[*>"\s]+/, '')
    .replace(/[*"]+$/, '')
    .trim();

  // Split into H2 sections
  const h2Sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) h2Sections.push(current);
      current = { title: line.replace(/^## /, ''), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) h2Sections.push(current);

  const sections: ReportSection[] = h2Sections.map(s => {
    const id = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const titleLower = s.title.toLowerCase();
    const isCTA = titleLower.includes('cta') || (titleLower.includes('weekly') && titleLower.includes('cta'));

    if (isCTA) {
      return { id, title: s.title, subsections: [], ctas: parseCTAs(s.lines) };
    }

    const parsed = parseSectionContent(s.lines);
    return { id, title: s.title, ...parsed };
  });

  return { title, quote, sections };
}
