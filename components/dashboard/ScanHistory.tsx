import { format } from "date-fns";
import { ScanLine, Monitor } from "lucide-react";
import type { Scan } from "@prisma/client";

interface Props {
  scans: Scan[];
}

function parseDevice(ua?: string | null): string {
  if (!ua) return "Unknown";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

export default function ScanHistory({ scans }: Props) {
  return (
    <div className="bg-navy rounded-xl border border-navy/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-navy/80 flex items-center gap-2">
        <ScanLine className="h-4 w-4 text-silver/60" />
        <h3 className="text-white font-medium text-sm">Scan History</h3>
        <span className="bg-white/10 text-silver text-xs rounded px-1.5 py-0.5">
          {scans.length}
        </span>
      </div>

      {scans.length === 0 ? (
        <div className="py-8 text-center">
          <Monitor className="h-7 w-7 text-silver/20 mx-auto mb-2" />
          <p className="text-silver text-sm">No scans yet</p>
          <p className="text-silver/40 text-xs mt-1">
            Scan events will appear here when the QR code is scanned
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy/60">
                <th className="text-left text-silver/50 font-medium uppercase tracking-wide px-4 py-2">
                  Time
                </th>
                <th className="text-left text-silver/50 font-medium uppercase tracking-wide px-4 py-2">
                  IP Address
                </th>
                <th className="text-left text-silver/50 font-medium uppercase tracking-wide px-4 py-2">
                  Device
                </th>
                <th className="text-left text-silver/50 font-medium uppercase tracking-wide px-4 py-2 hidden lg:table-cell">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan, i) => (
                <tr
                  key={scan.id}
                  className={
                    i !== scans.length - 1 ? "border-b border-navy/40" : ""
                  }
                >
                  <td className="px-4 py-2 text-silver whitespace-nowrap">
                    {format(scan.scannedAt, "dd MMM yyyy HH:mm:ss")}
                  </td>
                  <td className="px-4 py-2 text-silver font-mono">
                    {scan.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-silver">
                    {parseDevice(scan.userAgent)}
                  </td>
                  <td className="px-4 py-2 text-silver/40 max-w-xs truncate hidden lg:table-cell">
                    {scan.userAgent ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
