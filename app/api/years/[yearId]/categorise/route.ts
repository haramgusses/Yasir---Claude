import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireYear } from "@/lib/years";
import { isValidComplianceCode } from "@/lib/compliance/categories";

const Body = z.object({
  transactionIds: z.array(z.string()).min(1).max(2000),
  categoryId: z.string().optional(),
  newCategory: z
    .object({ name: z.string().min(1).max(100), complianceCode: z.string() })
    .optional(),
  funderName: z.string().max(150).optional(),
});

export async function POST(req: Request, { params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const b = parsed.data;
  if (!b.categoryId && !b.newCategory) {
    return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  }

  // Layer-2 categories are stored with Tier 3 codes (the superset);
  // conversion to Tier 4 codes happens at statement time.
  let categoryId = b.categoryId;
  if (b.newCategory) {
    if (!isValidComplianceCode(b.newCategory.complianceCode, "TIER_3")) {
      return NextResponse.json({ error: "Invalid category mapping." }, { status: 400 });
    }
    const cat = await prisma.category.upsert({
      where: { orgId_name: { orgId: year.orgId, name: b.newCategory.name } },
      create: {
        orgId: year.orgId,
        name: b.newCategory.name,
        complianceCode: b.newCategory.complianceCode,
      },
      update: { archived: false },
    });
    categoryId = cat.id;
  } else {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, orgId: year.orgId },
    });
    if (!cat) return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }

  let funderId: string | undefined;
  if (b.funderName) {
    const funder = await prisma.dimension.upsert({
      where: { orgId_kind_name: { orgId: year.orgId, kind: "FUNDER", name: b.funderName } },
      create: { orgId: year.orgId, kind: "FUNDER", name: b.funderName },
      update: {},
    });
    funderId = funder.id;
  }

  // Allocate each full transaction to the category (single split in v0.1;
  // the data model already supports partial splits). Only lines in this
  // year, owned by this org, and not yet allocated. The check-and-insert
  // runs inside a transaction to narrow the double-allocation window; the
  // review page's double-allocation check catches anything that slips past.
  const allocated = await prisma.$transaction(async (tx) => {
    const lines = await tx.sourceTransaction.findMany({
      where: {
        id: { in: b.transactionIds },
        batch: { yearId: year.id },
        splits: { none: {} },
      },
      select: { id: true, amountCents: true },
    });
    if (lines.length === 0) return 0;
    await tx.transactionSplit.createMany({
      data: lines.map((l) => ({
        sourceId: l.id,
        categoryId: categoryId!,
        funderId,
        amountCents: l.amountCents,
        confirmedAt: new Date(),
      })),
    });
    return lines.length;
  });

  return NextResponse.json({ allocated });
}

// Undo: remove the allocations for the given source transactions so they
// return to the queue. Everything is reversible (PLAN §3, design rule 6).
// Deletes ALL splits for each source — correct while v0.1 creates a single
// full-amount split per transaction, and doubles as the recovery path for
// accidental double-allocation. Revisit when partial splits ship.
const DeleteBody = z.object({
  sourceIds: z.array(z.string()).min(1).max(2000),
});

export async function DELETE(req: Request, { params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = DeleteBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await prisma.transactionSplit.deleteMany({
    where: {
      sourceId: { in: parsed.data.sourceIds },
      source: { batch: { yearId: year.id } },
    },
  });
  return NextResponse.json({ removed: result.count });
}
