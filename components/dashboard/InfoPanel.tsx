"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Check, Info } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@prisma/client";

interface Props {
  order: Order;
  scanUrl: string;
}

export default function InfoPanel({ order, scanUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(scanUrl).then(() => {
      setCopied(true);
      toast.success("Scan URL copied");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-navy rounded-xl border border-navy/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-navy/80 flex items-center gap-2">
        <Info className="h-4 w-4 text-silver/60" />
        <h3 className="text-white font-medium text-sm">Shipment Info</h3>
      </div>

      <div className="p-4 space-y-3">
        <Row label="Created" value={format(order.createdAt, "dd MMM yyyy 'at' HH:mm")} />
        <Row label="Updated" value={format(order.updatedAt, "dd MMM yyyy 'at' HH:mm")} />
        {order.expiresAt ? (
          <Row
            label="Expires"
            value={format(order.expiresAt, "dd MMM yyyy 'at' HH:mm")}
          />
        ) : (
          <Row label="Expires" value="Never (no expiry set)" />
        )}

        {order.notes && (
          <div className="pt-2 border-t border-navy/60">
            <p className="text-silver/60 text-xs uppercase tracking-wide font-medium mb-1.5">
              Notes
            </p>
            <p className="text-silver text-sm leading-relaxed">{order.notes}</p>
          </div>
        )}

        <div className="pt-2 border-t border-navy/60">
          <p className="text-silver/60 text-xs uppercase tracking-wide font-medium mb-1.5">
            Scan URL
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={scanUrl}
              className="flex-1 bg-app-black border border-navy/80 rounded-lg px-2 py-1.5 text-xs text-silver/70 font-mono focus:outline-none min-w-0 truncate"
            />
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg bg-app-black border border-navy/80 hover:border-silver/30 text-silver hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-silver/60 text-xs uppercase tracking-wide font-medium shrink-0">
        {label}
      </span>
      <span className="text-silver text-xs text-right">{value}</span>
    </div>
  );
}
