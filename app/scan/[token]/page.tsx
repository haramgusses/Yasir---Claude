import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Package, AlertTriangle, XCircle } from "lucide-react";
import ScanDocumentViewer from "@/components/scan/ScanDocumentViewer";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function logScan(orderId: string) {
  const headersList = headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent") ?? undefined;

  await prisma.scan.create({
    data: { orderId, ipAddress: ip, userAgent },
  });
}

export default async function ScanPage({
  params,
}: {
  params: { token: string };
}) {
  const order = await prisma.order.findUnique({
    where: { token: params.token },
    include: { docs: { orderBy: { uploadedAt: "desc" } } },
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-app-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-silver" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Shipment Not Found
          </h1>
          <p className="text-silver leading-relaxed">
            This QR code does not match any shipment record. It may have been
            deleted or the link is invalid.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-silver/40 text-sm">
            <Package className="h-4 w-4" />
            <span>ShipQR Logistics Platform</span>
          </div>
        </div>
      </div>
    );
  }

  // Log the scan for all requests (expired or active)
  await logScan(order.id);

  const isExpired = !!(order.expiresAt && order.expiresAt < new Date());

  if (isExpired) {
    return (
      <div className="min-h-screen bg-app-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-app-yellow" />
          </div>
          <div className="inline-flex items-center gap-2 bg-app-yellow/10 border border-app-yellow/30 rounded-full px-3 py-1 mb-4">
            <span className="text-app-yellow text-xs font-medium uppercase tracking-wide">
              Expired
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            QR Code Expired
          </h1>
          <p className="text-silver leading-relaxed mb-4">
            This QR code expired on{" "}
            <span className="text-white">
              {format(order.expiresAt!, "dd MMM yyyy 'at' HH:mm")}
            </span>
            . Please contact the sender for an updated link.
          </p>
          <div className="bg-navy rounded-xl p-4 text-left text-sm space-y-2 mb-8">
            <div className="flex justify-between">
              <span className="text-silver">Order Ref</span>
              <span className="text-white font-medium">{order.orderRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-silver">Recipient</span>
              <span className="text-white">{order.recipient}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-silver/40 text-sm">
            <Package className="h-4 w-4" />
            <span>ShipQR Logistics Platform</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-black">
      {/* Header */}
      <header className="border-b border-navy bg-navy/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-burgundy rounded-lg p-1.5">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">
                {order.orderRef}
              </span>
              <span className="text-silver text-xs block leading-none">
                {order.recipient}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-navy border border-navy/80 rounded-full px-3 py-1 text-xs text-silver">
              {order.shipmentType}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1 text-xs text-green-400 font-medium">
              Active
            </span>
          </div>
        </div>
      </header>

      <ScanDocumentViewer docs={order.docs} />

      <footer className="border-t border-navy mt-8 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 text-silver/40 text-sm">
          <Package className="h-3.5 w-3.5" />
          <span>Powered by ShipQR Logistics Platform</span>
        </div>
      </footer>
    </div>
  );
}
