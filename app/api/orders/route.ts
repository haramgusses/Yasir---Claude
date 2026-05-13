import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const orders = await prisma.order.findMany({
      where: {
        createdBy: userId,
        ...(search
          ? {
              OR: [
                { orderRef: { contains: search, mode: "insensitive" } },
                { recipient: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        docs: true,
        _count: { select: { scans: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { orderRef, recipient, shipmentType, notes, expiresAt, docs } =
      result.data;

    const order = await prisma.order.create({
      data: {
        orderRef,
        recipient,
        shipmentType,
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: userId,
        docs: {
          create: docs.map((doc) => ({
            name: doc.name,
            size: doc.size,
            mimeType: doc.mimeType,
            extension: doc.extension,
            docType: doc.docType,
            fileUrl: doc.fileUrl,
          })),
        },
      },
      include: { docs: true },
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
