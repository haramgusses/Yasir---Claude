"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Plus, FileText, ChevronRight, Clock } from "lucide-react";
import CreateOrderModal from "./CreateOrderModal";
import type { Order, Document } from "@prisma/client";

type OrderWithDocs = Order & {
  docs: Document[];
  _count: { scans: number };
};

interface Props {
  initialOrders: OrderWithDocs[];
}

function StatusBadge({ expiresAt }: { expiresAt: Date | null }) {
  const isExpired = !!(expiresAt && expiresAt < new Date());
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 bg-app-yellow/10 border border-app-yellow/30 text-app-yellow text-xs px-2 py-0.5 rounded-full font-medium">
        <Clock className="h-3 w-3" />
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Active
    </span>
  );
}

export default function OrdersTable({ initialOrders }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = initialOrders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderRef.toLowerCase().includes(q) ||
      o.recipient.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver/50" />
          <input
            type="text"
            placeholder="Search by order ref or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy border border-navy/80 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-silver/40 focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Shipment
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-navy rounded-xl border border-navy/80 p-12 text-center">
          <div className="w-12 h-12 bg-navy/80 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-silver/40" />
          </div>
          <p className="text-white font-medium mb-1">
            {search ? "No results found" : "No shipments yet"}
          </p>
          <p className="text-silver text-sm">
            {search
              ? "Try a different search term"
              : "Create your first shipment to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-navy rounded-xl border border-navy/80 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/80">
                  <th className="text-left text-silver text-xs font-medium uppercase tracking-wide px-4 py-3">
                    Order Ref
                  </th>
                  <th className="text-left text-silver text-xs font-medium uppercase tracking-wide px-4 py-3">
                    Recipient
                  </th>
                  <th className="text-left text-silver text-xs font-medium uppercase tracking-wide px-4 py-3">
                    Type
                  </th>
                  <th className="text-left text-silver text-xs font-medium uppercase tracking-wide px-4 py-3">
                    Docs
                  </th>
                  <th className="text-left text-silver text-xs font-medium uppercase tracking-wide px-4 py-3">
                    Created
                  </th>
                  <th className="text-left text-silver text-xs font-medium uppercase tracking-wide px-4 py-3">
                    Expiry
                  </th>
                  <th className="text-left text-silver text-xs font-medium uppercase tracking-wide px-4 py-3">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <tr
                    key={order.id}
                    onClick={() =>
                      router.push(`/dashboard/orders/${order.id}`)
                    }
                    className={`cursor-pointer hover:bg-white/5 transition-colors ${
                      i !== filtered.length - 1 ? "border-b border-navy/60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-white font-medium font-mono text-xs">
                      {order.orderRef}
                    </td>
                    <td className="px-4 py-3 text-silver">{order.recipient}</td>
                    <td className="px-4 py-3">
                      <span className="text-silver text-xs bg-white/5 rounded px-2 py-1">
                        {order.shipmentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-silver">
                      {order.docs.length}
                    </td>
                    <td className="px-4 py-3 text-silver text-xs">
                      {format(order.createdAt, "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-silver text-xs">
                      {order.expiresAt
                        ? format(order.expiresAt, "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge expiresAt={order.expiresAt} />
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-silver/30" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-navy/60">
            {filtered.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-white font-medium font-mono text-xs">
                    {order.orderRef}
                  </span>
                  <StatusBadge expiresAt={order.expiresAt} />
                </div>
                <p className="text-silver text-sm mb-2">{order.recipient}</p>
                <div className="flex items-center gap-4 text-xs text-silver/60">
                  <span>{order.shipmentType}</span>
                  <span>{order.docs.length} docs</span>
                  <span>{format(order.createdAt, "dd MMM yyyy")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-silver/40 text-right">
        {filtered.length} of {initialOrders.length} orders
      </div>

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
