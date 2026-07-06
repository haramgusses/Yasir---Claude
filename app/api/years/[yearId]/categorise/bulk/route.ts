import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireYear } from "@/lib/years";
import { isValidComplianceCode } from "@/lib/compliance/categories";

// Bulk-accept of high-confidence suggestions: each entry names the target
// category (created if new). Groups that need the funder question are
// excluded client-side so granularity is never silently skipped (PLAN §5).
const Body = z.object({
  assignments: z
    .array(
      z.object({
        transactionIds: z.array(z.string()).min(1).max(2000),
        name: z.string().min(1).max(100),
        complianceCode: z.string(),
      })
    )
    .min(1)
    .max(200),
});

export async function POST(req: Request, { params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  for (const a of parsed.data.assignments) {
    if (!isValidComplianceCode(a.complianceCode, "TIER_3")) {
      return NextResponse.json(
        { error: `Invalid category mapping for "${a.name}".` },
        { status: 400 }
      );
    }
  }

  let allocated = 0;
  for (const a of parsed.data.assignments) {
    const cat = await prisma.category.upsert({
      where: { orgId_name: { orgId: year.orgId, name: a.name } },
      create: { orgId: year.orgId, name: a.name, complianceCode: a.complianceCode },
      update: { archived: false },
    });
    const lines = await prisma.sourceTransaction.findMany({
      where: {
        id: { in: a.transactionIds },
        batch: { yearId: year.id },
        splits: { none: {} },
      },
      select: { id: true, amountCents: true },
    });
    if (lines.length === 0) continue;
    await prisma.transactionSplit.createMany({
      data: lines.map((l) => ({
        sourceId: l.id,
        categoryId: cat.id,
        amountCents: l.amountCents,
        confirmedAt: new Date(),
      })),
    });
    allocated += lines.length;
  }

  return NextResponse.json({ allocated });
}
