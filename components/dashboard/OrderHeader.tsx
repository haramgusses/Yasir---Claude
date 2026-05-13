"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Trash2, Clock, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@prisma/client";

interface Props {
  order: Order;
  isExpired: boolean;
}

export default function OrderHeader({ order, isExpired }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Shipment deleted");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to delete shipment");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex-1">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-silver hover:text-white text-sm mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white font-mono">
            {order.orderRef}
          </h1>
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 bg-app-yellow/10 border border-app-yellow/30 text-app-yellow text-xs px-3 py-1 rounded-full font-medium">
              <Clock className="h-3.5 w-3.5" />
              Expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-3 py-1 rounded-full font-medium">
              <CheckCircle className="h-3.5 w-3.5" />
              Active
            </span>
          )}
          <span className="bg-white/5 text-silver text-xs px-3 py-1 rounded-full">
            {order.shipmentType}
          </span>
        </div>
        <p className="text-silver mt-1">{order.recipient}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-navy border border-navy/80 hover:border-silver/30 text-silver hover:text-white text-sm px-3 py-2 rounded-lg transition-colors"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Print Label</span>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${
            confirmDelete
              ? "bg-burgundy text-white"
              : "bg-navy border border-navy/80 hover:border-burgundy/50 text-silver hover:text-burgundy"
          }`}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </span>
        </button>
      </div>
    </div>
  );
}
