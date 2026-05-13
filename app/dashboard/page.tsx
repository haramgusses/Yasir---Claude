import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import MetricCards from "@/components/dashboard/MetricCards";
import OrdersTable from "@/components/dashboard/OrdersTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();

  const [orders, totalDocs] = await Promise.all([
    prisma.order.findMany({
      where: { createdBy: userId! },
      include: {
        docs: true,
        _count: { select: { scans: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.document.count({
      where: { order: { createdBy: userId! } },
    }),
  ]);

  const now = new Date();
  const metrics = {
    totalOrders: orders.length,
    totalDocs,
    activeQR: orders.filter((o) => !o.expiresAt || o.expiresAt > now).length,
    expiredQR: orders.filter((o) => o.expiresAt && o.expiresAt <= now).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shipment Dashboard</h1>
          <p className="text-silver mt-1 text-sm">
            Manage shipment documents and QR access codes
          </p>
        </div>
      </div>

      <MetricCards metrics={metrics} />
      <OrdersTable initialOrders={orders} />
    </div>
  );
}
