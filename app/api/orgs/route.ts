import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentFinancialYear } from "@/lib/years";
import { seedCategories } from "@/lib/compliance/starterPacks";

const Body = z.object({
  name: z.string().min(2).max(200),
  entityKind: z.enum(["CHARITABLE_TRUST", "INCORPORATED_SOCIETY", "SOCIETY_AND_CHARITY", "OTHER"]),
  balanceDate: z.string().regex(/^\d{2}-\d{2}$/),
  gstStatus: z.enum(["REGISTERED", "NOT_REGISTERED", "UNSURE"]),
  sectorPack: z.string(),
  priorSpendBand: z.enum(["UNDER_140K", "OVER_140K", "FIRST_YEAR", "UNSURE"]),
  publicAccountability: z.boolean(),
  isFirstYear: z.boolean(),
});

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const b = parsed.data;
  const [month, day] = b.balanceDate.split("-").map(Number);
  const fy = currentFinancialYear(month, day);

  // Seed with Tier 3 codes (the provisional default until detection runs);
  // categoriesForTier conversion happens at statement time via the
  // equivalence map, so a tier flip never strands categories.
  const seeds = seedCategories(b.sectorPack, "TIER_3");

  const org = await prisma.organisation.create({
    data: {
      name: b.name,
      clerkUserId: userId,
      entityKind: b.entityKind,
      balanceDateMonth: month,
      balanceDateDay: day,
      gstStatus: b.gstStatus,
      sectorPack: b.sectorPack,
      categories: {
        create: seeds.map((c) => ({ name: c.name, complianceCode: c.complianceCode })),
      },
      dimensions: {
        create: seeds
          .filter((c) => c.isProgramme)
          .map((c) => ({ kind: "PROGRAMME" as const, name: c.name })),
      },
      years: {
        create: {
          startDate: fy.start,
          endDate: fy.end,
          isFirstYear: b.isFirstYear || b.priorSpendBand === "FIRST_YEAR",
          priorYearSpendBand: b.priorSpendBand,
          answers: {
            create: {
              questionKey: "public_accountability",
              answer: { value: b.publicAccountability },
            },
          },
        },
      },
    },
    include: { years: true },
  });

  return NextResponse.json({ orgId: org.id, yearId: org.years[0].id });
}
