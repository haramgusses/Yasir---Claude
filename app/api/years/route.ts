import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Start the next financial year: one year on from the organisation's most
// recent year. Carries the public-accountability answer forward; the
// prior-spend band resets to UNSURE until real data answers it.
export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organisation.findFirst({
    where: { clerkUserId: userId },
    include: { years: { orderBy: { endDate: "desc" }, take: 1 } },
  });
  if (!org || org.years.length === 0) {
    return NextResponse.json({ error: "No organisation found." }, { status: 404 });
  }

  const latest = org.years[0];
  const start = new Date(latest.endDate);
  start.setUTCDate(start.getUTCDate() + 1);
  const end = new Date(latest.endDate);
  end.setUTCFullYear(end.getUTCFullYear() + 1);

  const existing = await prisma.financialYear.findUnique({
    where: { orgId_endDate: { orgId: org.id, endDate: end } },
  });
  if (existing) return NextResponse.json({ yearId: existing.id });

  const prevAnswer = await prisma.interviewAnswer.findUnique({
    where: { yearId_questionKey: { yearId: latest.id, questionKey: "public_accountability" } },
  });

  const year = await prisma.financialYear.create({
    data: {
      orgId: org.id,
      startDate: start,
      endDate: end,
      isFirstYear: false,
      priorYearSpendBand: "UNSURE",
      answers: prevAnswer
        ? {
            create: {
              questionKey: "public_accountability",
              answer: prevAnswer.answer as object,
            },
          }
        : undefined,
    },
  });

  return NextResponse.json({ yearId: year.id });
}
