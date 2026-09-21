interface ExtractedItem {
  title: string;
  date: string; // ISO YYYY-MM-DD
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const DATE_PATTERN = new RegExp(
  `(?:(${Object.keys(MONTHS).join("|")})[a-z]*\\.?\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?)` +
  `|(?:(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?)`,
  "i"
);

function parseDate(match: RegExpMatchArray, defaultYear: number): string | null {
  if (match[1]) {
    const month = MONTHS[match[1].toLowerCase()];
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : defaultYear;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (match[4]) {
    const month = parseInt(match[4], 10) - 1;
    const day = parseInt(match[5], 10);
    let year = match[6] ? parseInt(match[6], 10) : defaultYear;
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return null;
}

export function parseSyllabusText(text: string, defaultYear = new Date().getFullYear()): ExtractedItem[] {
  const lines = text.split(/\r?\n/);
  const results: ExtractedItem[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(DATE_PATTERN);
    if (!match) continue;

    const date = parseDate(match, defaultYear);
    if (!date) continue;

    const title = line.replace(match[0], "").replace(/[-—:()\s]+$/, "").trim();
    if (title.length < 3) continue;

    results.push({ title, date });
  }

  return results;
}
