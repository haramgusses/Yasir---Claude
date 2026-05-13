import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { token: params.token },
      include: { docs: { orderBy: { uploadedAt: "desc" } } },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Log every scan attempt (expired or active)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await prisma.scan.create({
      data: { orderId: order.id, ipAddress: ip, userAgent },
    });

    if (order.expiresAt && order.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "expired",
          data: {
            orderRef: order.orderRef,
            recipient: order.recipient,
            expiresAt: order.expiresAt,
          },
        },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[GET /api/scan/[token]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
