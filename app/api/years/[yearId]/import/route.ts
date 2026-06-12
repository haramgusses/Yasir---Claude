import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate } from "@/lib/years";
import { parseBankCsv } from "@/lib/import/parse";
import { computeLineHashes, verifyBalances, checkRunningBalance } from "@/lib/import/verify";
import { matchTransfers, detectReversals, type MatchableLine } from "@/lib/import/transfers";

const toUtc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

export async function POST(req: Request, { params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  const accountId = String(form.get("accountId") ?? "");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, orgId: year.orgId },
  });
  if (!account) return NextResponse.json({ error: "Unknown account." }, { status: 400 });
  if (file.size > 5_000_000) return NextResponse.json({ error: "File too large — bank CSV exports are normally well under 5MB." }, { status: 400 });

  const parsed = parseBankCsv(await file.text());
  if (parsed.lines.length === 0) {
    return NextResponse.json(
      { error: parsed.warnings[0] ?? "No transactions found in that file." },
      { status: 422 }
    );
  }

  // Keep only lines inside this financial year so batch balances and
  // coverage describe the reporting period.
  const yearStart = isoDate(year.startDate);
  const yearEnd = isoDate(year.endDate);
  const inYear = parsed.lines.filter((l) => l.date >= yearStart && l.date <= yearEnd);
  const outsideYear = parsed.lines.length - inYear.length;
  if (inYear.length === 0) {
    return NextResponse.json(
      { error: `That file's transactions all fall outside the financial year (${yearStart} to ${yearEnd}).` },
      { status: 422 }
    );
  }
  inYear.sort((a, b) => a.date.localeCompare(b.date));

  // Dedupe against everything already imported for this account+year.
  // Hash ordinals stay consistent because existing lines are always fed in
  // insertion order, with incoming lines appended.
  const existing = await prisma.sourceTransaction.findMany({
    where: { accountId, batch: { yearId: year.id } },
    orderBy: { createdAt: "asc" },
    select: { lineHash: true, date: true, amountCents: true, payee: true, particulars: true, reference: true },
  });
  const combined = [
    ...existing.map((e) => ({
      date: isoDate(e.date),
      amountCents: e.amountCents,
      payee: e.payee ?? "",
      particulars: e.particulars ?? "",
      reference: e.reference ?? "",
    })),
    ...inYear.map((l) => ({
      date: l.date,
      amountCents: l.amountCents,
      payee: l.payee,
      particulars: l.particulars,
      reference: l.reference,
    })),
  ];
  const hashes = computeLineHashes(combined).slice(existing.length);
  const existingHashes = new Set(existing.map((e) => e.lineHash));
  const fresh = inYear
    .map((line, i) => ({ line, hash: hashes[i] }))
    .filter((x) => !existingHashes.has(x.hash));

  // Balance verification from the export's own running balance when present.
  const runningBreaks = checkRunningBalance(inYear);
  const first = inYear[0];
  const last = inYear[inYear.length - 1];
  const hasBalances = first.balanceCents !== undefined && last.balanceCents !== undefined;
  const openingBalanceCents = hasBalances ? first.balanceCents! - first.amountCents : null;
  const closingBalanceCents = hasBalances ? last.balanceCents! : null;
  const balanceCheck =
    hasBalances && openingBalanceCents !== null && closingBalanceCents !== null
      ? verifyBalances(openingBalanceCents, closingBalanceCents, inYear)
      : null;
  const balancesVerified = !!balanceCheck?.ok && runningBreaks.length === 0;

  const batch = await prisma.importBatch.create({
    data: {
      yearId: year.id,
      accountId,
      source: "CSV",
      fileName: file.name,
      openingBalanceCents,
      closingBalanceCents,
      balancesVerified,
      periodStart: toUtc(first.date),
      periodEnd: toUtc(last.date),
      lines: {
        create: fresh.map(({ line, hash }) => ({
          accountId,
          date: toUtc(line.date),
          amountCents: line.amountCents,
          payee: line.payee || null,
          particulars: line.particulars || null,
          reference: line.reference || null,
          rawLine: line.raw,
          lineHash: hash,
        })),
      },
    },
  });

  // Match inter-account transfers and reversals across the year's
  // unallocated lines, so they never reach the categorisation queue.
  const candidates = await prisma.sourceTransaction.findMany({
    where: {
      batch: { yearId: year.id },
      isTransfer: false,
      reversalOfId: null,
      reversedBy: null,
      splits: { none: {} },
    },
    select: { id: true, accountId: true, date: true, amountCents: true, payee: true, particulars: true },
  });
  const matchable: MatchableLine[] = candidates.map((c) => ({
    id: c.id,
    accountId: c.accountId,
    date: isoDate(c.date),
    amountCents: c.amountCents,
    payee: c.payee ?? c.particulars ?? "",
  }));
  const transferIds = matchTransfers(matchable).flatMap((p) => [p.outId, p.inId]);
  if (transferIds.length > 0) {
    await prisma.sourceTransaction.updateMany({
      where: { id: { in: transferIds } },
      data: { isTransfer: true },
    });
  }
  const reversals = detectReversals(matchable.filter((m) => !transferIds.includes(m.id)));
  for (const r of reversals) {
    await prisma.sourceTransaction.update({
      where: { id: r.reversalId },
      data: { reversalOfId: r.originalId },
    });
  }

  return NextResponse.json({
    batchId: batch.id,
    imported: fresh.length,
    duplicates: inYear.length - fresh.length,
    outsideYear,
    rejectedRows: parsed.rejectedRows.length,
    profile: parsed.profileKey,
    transfersMatched: transferIds.length / 2,
    reversalsMatched: reversals.length,
    balanceCheck,
    warnings: parsed.warnings,
  });
}

/** Manual opening/closing balance entry for exports without a balance column. */
export async function PATCH(req: Request, { params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const batchId = String(body.batchId ?? "");
  const openingBalanceCents = Math.round(Number(body.openingBalanceCents));
  const closingBalanceCents = Math.round(Number(body.closingBalanceCents));
  if (!batchId || !Number.isFinite(openingBalanceCents) || !Number.isFinite(closingBalanceCents)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const batch = await prisma.importBatch.findFirst({
    where: { id: batchId, yearId: year.id },
    include: { lines: { select: { amountCents: true } } },
  });
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const check = verifyBalances(openingBalanceCents, closingBalanceCents, batch.lines);
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { openingBalanceCents, closingBalanceCents, balancesVerified: check.ok },
  });
  return NextResponse.json({ balanceCheck: check });
}
