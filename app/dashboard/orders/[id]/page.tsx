import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderHeader from "@/components/dashboard/OrderHeader";
import DocumentPanel from "@/components/dashboard/DocumentPanel";
import QRLabelCard from "@/components/dashboard/QRLabelCard";
import ScanHistory from "@/components/dashboard/ScanHistory";
import InfoPanel from "@/components/dashboard/InfoPanel";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  const order = await prisma.order.findFirst({
    where: { id: params.id, createdBy: userId! },
    include: {
      docs: { orderBy: { uploadedAt: "desc" } },
      scans: { orderBy: { scannedAt: "desc" } },
    },
  });

  if (!order) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const scanUrl = `${appUrl}/scan/${order.token}`;
  const isExpired = !!(order.expiresAt && order.expiresAt < new Date());

  return (
    <div className="space-y-6">
      <OrderHeader order={order} isExpired={isExpired} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Documents + Scan History */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentPanel docs={order.docs} />
          <ScanHistory scans={order.scans} />
        </div>

        {/* Right: QR Label + Info */}
        <div className="space-y-6">
          <QRLabelCard order={order} scanUrl={scanUrl} isExpired={isExpired} />
          <InfoPanel order={order} scanUrl={scanUrl} />
        </div>
      </div>
    </div>
  );
}
