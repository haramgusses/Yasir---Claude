import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireYear } from "@/lib/years";

export async function POST(req: Request, { params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = z.object({ name: z.string().min(1).max(100) }).safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const account = await prisma.bankAccount.create({
    data: { orgId: year.orgId, name: body.data.name },
  });
  return NextResponse.json({ id: account.id });
}
