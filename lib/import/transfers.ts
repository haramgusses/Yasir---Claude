// Inter-account transfer matching and reversal detection (docs/PLAN.md §6.2,
// §7 "Duplicates, reversals, fees"). Matched transfers are eliminated from
// revenue/expense; reversal pairs are netted and shown as a visible group.

export interface MatchableLine {
  id: string;
  accountId: string;
  date: string; // ISO
  amountCents: number; // signed
  payee: string;
}

export interface MatchedPair {
  outId: string;
  inId: string;
}

const dayDiff = (a: string, b: string) =>
  Math.abs(Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) -
           Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10))) / 86_400_000;

/**
 * Greedy match of inter-account transfers: same absolute amount, opposite
 * sign, different accounts, within `windowDays`. Closest-date pairing first
 * so a same-day pair beats a two-days-apart pair for the same amount.
 */
export function matchTransfers(lines: MatchableLine[], windowDays = 2): MatchedPair[] {
  const outs = lines.filter((l) => l.amountCents < 0);
  const ins = lines.filter((l) => l.amountCents > 0);
  const candidates: { out: MatchableLine; inn: MatchableLine; gap: number }[] = [];
  for (const out of outs) {
    for (const inn of ins) {
      if (inn.accountId === out.accountId) continue;
      if (inn.amountCents !== -out.amountCents) continue;
      const gap = dayDiff(out.date, inn.date);
      if (gap <= windowDays) candidates.push({ out, inn, gap });
    }
  }
  candidates.sort((a, b) => a.gap - b.gap);
  const used = new Set<string>();
  const pairs: MatchedPair[] = [];
  for (const c of candidates) {
    if (used.has(c.out.id) || used.has(c.inn.id)) continue;
    used.add(c.out.id);
    used.add(c.inn.id);
    pairs.push({ outId: c.out.id, inId: c.inn.id });
  }
  return pairs;
}

/**
 * Reversal detection within one account: same absolute amount, opposite
 * sign, similar payee, within `windowDays` (default 5). Returns pairs where
 * `originalId` is the earlier line.
 */
export function detectReversals(
  lines: MatchableLine[],
  windowDays = 5
): { originalId: string; reversalId: string }[] {
  const byAccount = new Map<string, MatchableLine[]>();
  for (const l of lines) {
    const arr = byAccount.get(l.accountId) ?? [];
    arr.push(l);
    byAccount.set(l.accountId, arr);
  }
  const out: { originalId: string; reversalId: string }[] = [];
  const used = new Set<string>();
  for (const arr of byAccount.values()) {
    const sorted = [...arr].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sorted.length; i++) {
      if (used.has(sorted[i].id)) continue;
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (used.has(b.id)) continue;
        if (dayDiff(a.date, b.date) > windowDays) break;
        if (b.amountCents !== -a.amountCents) continue;
        if (!similarPayee(a.payee, b.payee)) continue;
        used.add(a.id);
        used.add(b.id);
        out.push({ originalId: a.id, reversalId: b.id });
        break;
      }
    }
  }
  return out;
}

function similarPayee(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/\b(reversal|rev|refund)\b/g, "").replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/\b(reversal|rev|refund)\b/g, "").replace(/\s+/g, " ").trim();
  if (!na || !nb) return true; // empty payees: rely on amount+window
  return na.includes(nb) || nb.includes(na);
}
