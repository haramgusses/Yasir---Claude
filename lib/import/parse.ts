// Bank statement CSV parsing: RFC 4180 parser + per-bank column profiles +
// generic user-supplied mapping fallback (docs/PLAN.md §6.1).
// Bank profiles are drafted from documented export formats and MUST be
// verified against real sample exports before release (PLAN §2.9.8) — the
// balance-verification gate (verify.ts) is the safety net either way.

export interface ParsedLine {
  /** ISO date, YYYY-MM-DD (no timezone games). */
  date: string;
  /** Signed; positive = money in. */
  amountCents: number;
  payee: string;
  particulars: string;
  reference: string;
  /** Running balance after this line, when the export includes one. */
  balanceCents?: number;
  /** Category text found in the file itself (a pre-coded export), carried over. */
  importedCategory?: string;
  raw: Record<string, string>;
}

export interface ParseResult {
  lines: ParsedLine[];
  profileKey: string;
  warnings: string[];
  /** Rows that could not be parsed (shown to the user, never silently dropped). */
  rejectedRows: { rowIndex: number; reason: string; cells: string[] }[];
}

export interface ColumnMapping {
  date: string;
  /** Either a single signed amount column… */
  amount?: string;
  /** …or separate debit/credit columns (debit treated as money out). */
  debit?: string;
  credit?: string;
  payee?: string;
  particulars?: string;
  reference?: string;
  balance?: string;
}

interface BankProfile {
  key: string;
  /** Header names that identify this profile (lower-cased, all must appear). */
  signature: string[];
  mapping: ColumnMapping;
}

// Draft profiles — column names per documented bank CSV exports; verify with
// real samples (PLAN §2.9.8). Header matching is case-insensitive.
const BANK_PROFILES: BankProfile[] = [
  {
    key: "anz",
    signature: ["type", "details", "particulars", "code", "reference", "amount", "date"],
    mapping: { date: "date", amount: "amount", payee: "details", particulars: "particulars", reference: "reference" },
  },
  {
    key: "asb",
    signature: ["date", "unique id", "tran type", "payee", "memo", "amount"],
    mapping: { date: "date", amount: "amount", payee: "payee", particulars: "memo", reference: "unique id" },
  },
  {
    key: "bnz",
    signature: ["date", "amount", "payee", "particulars", "code", "reference"],
    mapping: { date: "date", amount: "amount", payee: "payee", particulars: "particulars", reference: "reference" },
  },
  {
    key: "westpac",
    signature: ["date", "amount", "other party", "description", "analysis code"],
    mapping: { date: "date", amount: "amount", payee: "other party", particulars: "description", reference: "analysis code" },
  },
  {
    key: "kiwibank",
    signature: ["date", "memo/description", "amount", "balance"],
    mapping: { date: "date", amount: "amount", payee: "memo/description", particulars: "memo/description", balance: "balance" },
  },
];

/** Minimal RFC 4180 CSV parser (quoted fields, embedded commas/newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, ""); // strip BOM
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Drop fully-empty trailing rows.
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** "$1,234.56", "(123.45)", "-123.45", "123.45 CR" → signed cents. */
export function parseAmountCents(value: string): number | null {
  let s = value.trim();
  if (s === "") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/\bDR\b/i.test(s)) negative = true;
  s = s.replace(/\b(CR|DR)\b/gi, "");
  s = s.replace(/[$,\s]/g, "");
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const cents = parseInt(whole, 10) * 100 + parseInt((frac + "00").slice(0, 2), 10);
  return negative ? -cents : cents;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** NZ bank date formats → ISO YYYY-MM-DD. Day-first for ambiguous forms. */
export function parseDateISO(value: string): string | null {
  const s = value.trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (m) return iso(2000 + +m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon) return iso(+m[3], mon, +m[1]);
  }
  return null;
}

function iso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function findHeaderRow(rows: string[][]): { index: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const lower = rows[i].map((c) => c.trim().toLowerCase());
    if (lower.includes("date") && (lower.includes("amount") || (lower.some((h) => h.includes("debit")) && lower.some((h) => h.includes("credit"))))) {
      return { index: i, headers: lower };
    }
  }
  return null;
}

function detectProfile(headers: string[]): BankProfile | null {
  for (const p of BANK_PROFILES) {
    if (p.signature.every((sig) => headers.includes(sig))) return p;
  }
  return null;
}

/**
 * Find a column that carries the user's OWN categorisation (a pre-coded
 * export from Xero/a spreadsheet where someone already sorted each line).
 * Heuristics: header sounds category-ish, column isn't one we already map,
 * values are mostly non-numeric text with plenty of repetition (categories
 * repeat; free-text descriptions don't).
 */
function detectCategoryColumn(
  headers: string[],
  dataRows: string[][],
  usedIndexes: number[]
): number {
  const CANDIDATE = /categor|classif|coding|gl ?code|account ?name|expense type|income type|^tag/i;
  for (let i = 0; i < headers.length; i++) {
    if (usedIndexes.includes(i)) continue;
    if (!CANDIDATE.test(headers[i])) continue;
    const values = dataRows
      .map((r) => (i < r.length ? r[i].trim() : ""))
      .filter((v) => v !== "");
    if (values.length < Math.max(2, dataRows.length * 0.3)) continue;
    const nonNumeric = values.filter(
      (v) => parseAmountCents(v) === null && parseDateISO(v) === null
    );
    if (nonNumeric.length < values.length * 0.8) continue;
    const distinct = new Set(values.map((v) => v.toLowerCase())).size;
    if (distinct > Math.max(30, values.length * 0.6)) continue; // free text, not categories
    return i;
  }
  return -1;
}

/**
 * Parse a bank CSV export. Uses a detected bank profile, or `mapping` when
 * supplied (the generic mapper — column names as they appear in the file).
 */
export function parseBankCsv(text: string, mapping?: ColumnMapping): ParseResult {
  const warnings: string[] = [];
  const rejectedRows: ParseResult["rejectedRows"] = [];
  const rows = parseCsv(text);
  const header = findHeaderRow(rows);
  if (!header) {
    return { lines: [], profileKey: "unknown", warnings: ["Could not find a header row with Date and Amount columns. Use the column mapper."], rejectedRows };
  }
  const profile = mapping ? null : detectProfile(header.headers);
  const map: ColumnMapping | undefined = mapping ?? profile?.mapping;
  if (!map) {
    return { lines: [], profileKey: "unknown", warnings: ["Bank format not recognised. Use the column mapper to tell us which column is which."], rejectedRows };
  }
  const col = (name?: string) => (name ? header.headers.indexOf(name.toLowerCase()) : -1);
  const ix = {
    date: col(map.date),
    amount: col(map.amount),
    debit: col(map.debit),
    credit: col(map.credit),
    payee: col(map.payee),
    particulars: col(map.particulars),
    reference: col(map.reference),
    balance: col(map.balance),
  };
  if (ix.date < 0 || (ix.amount < 0 && (ix.debit < 0 || ix.credit < 0))) {
    return { lines: [], profileKey: profile?.key ?? "custom", warnings: ["Mapped columns not found in the file header."], rejectedRows };
  }

  const categoryIx = detectCategoryColumn(
    header.headers,
    rows.slice(header.index + 1),
    Object.values(ix).filter((i) => i >= 0)
  );

  const lines: ParsedLine[] = [];
  for (let r = header.index + 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (i: number) => (i >= 0 && i < cells.length ? cells[i].trim() : "");
    const date = parseDateISO(get(ix.date));
    if (!date) {
      rejectedRows.push({ rowIndex: r, reason: `Unrecognised date "${get(ix.date)}"`, cells });
      continue;
    }
    let amountCents: number | null = null;
    if (ix.amount >= 0) {
      amountCents = parseAmountCents(get(ix.amount));
    } else {
      const debit = parseAmountCents(get(ix.debit));
      const credit = parseAmountCents(get(ix.credit));
      if (debit === null && credit === null) amountCents = null;
      else amountCents = (credit ?? 0) - Math.abs(debit ?? 0);
    }
    if (amountCents === null) {
      rejectedRows.push({ rowIndex: r, reason: "Unrecognised amount", cells });
      continue;
    }
    const balance = ix.balance >= 0 ? parseAmountCents(get(ix.balance)) : null;
    const raw: Record<string, string> = {};
    header.headers.forEach((h, i) => (raw[h] = get(i)));
    const importedCategory = categoryIx >= 0 ? get(categoryIx) : "";
    lines.push({
      date,
      amountCents,
      payee: get(ix.payee),
      particulars: get(ix.particulars),
      reference: get(ix.reference),
      ...(balance !== null ? { balanceCents: balance } : {}),
      ...(importedCategory ? { importedCategory } : {}),
      raw,
    });
  }
  if (rejectedRows.length > 0) {
    warnings.push(`${rejectedRows.length} row(s) could not be read and need your attention.`);
  }
  return { lines, profileKey: profile?.key ?? (mapping ? "custom" : "unknown"), warnings, rejectedRows };
}
