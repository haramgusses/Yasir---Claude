"use client";

import { QRCodeCanvas } from "qrcode.react";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import type { Order } from "@prisma/client";

interface Props {
  order: Order & { docs: { id: string }[] };
  scanUrl: string;
  isExpired: boolean;
}

export default function QRLabelCard({ order, scanUrl, isExpired }: Props) {
  return (
    <div className="bg-navy rounded-xl border border-navy/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-navy/80 flex items-center justify-between">
        <h3 className="text-white font-medium text-sm">QR Label</h3>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-silver hover:text-white text-xs transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
      </div>

      {/* Printable label */}
      <div id="qr-label-print" className="p-5">
        <div className="bg-white rounded-xl p-5 text-center shadow-sm">
          {isExpired && (
            <div className="mb-3 bg-red-50 text-red-600 text-xs font-medium rounded px-2 py-1">
              EXPIRED — Internal Record Only
            </div>
          )}

          <div className="flex justify-center mb-4">
            <QRCodeCanvas
              value={scanUrl}
              size={160}
              fgColor="#00100B"
              bgColor="#FFFFFF"
              level="M"
              includeMargin
            />
          </div>

          <div className="text-left space-y-1.5 border-t border-gray-100 pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Order Ref</span>
              <span className="text-gray-900 font-bold font-mono">
                {order.orderRef}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Recipient</span>
              <span className="text-gray-900 text-right max-w-[60%] truncate">
                {order.recipient}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Type</span>
              <span className="text-gray-900">{order.shipmentType}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Documents</span>
              <span className="text-gray-900">{order.docs.length}</span>
            </div>
            {order.expiresAt && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Expires</span>
                <span className="text-gray-900">
                  {format(order.expiresAt, "dd MMM yyyy")}
                </span>
              </div>
            )}
          </div>

          <p className="text-gray-400 text-[10px] mt-3 border-t border-gray-100 pt-2">
            Scan to access shipment documents
          </p>
        </div>
      </div>
    </div>
  );
}
