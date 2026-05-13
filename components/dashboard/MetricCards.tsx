import { Package, FileText, QrCode, Clock } from "lucide-react";

interface Props {
  metrics: {
    totalOrders: number;
    totalDocs: number;
    activeQR: number;
    expiredQR: number;
  };
}

const cards = [
  {
    key: "totalOrders" as const,
    label: "Total Orders",
    icon: Package,
    color: "text-white",
    bg: "bg-burgundy/10 border-burgundy/20",
    iconColor: "text-burgundy",
  },
  {
    key: "totalDocs" as const,
    label: "Total Documents",
    icon: FileText,
    color: "text-white",
    bg: "bg-navy border-navy/80",
    iconColor: "text-silver",
  },
  {
    key: "activeQR" as const,
    label: "Active QR Links",
    icon: QrCode,
    color: "text-white",
    bg: "bg-green-500/10 border-green-500/20",
    iconColor: "text-green-400",
  },
  {
    key: "expiredQR" as const,
    label: "Expired QR Links",
    icon: Clock,
    color: "text-white",
    bg: "bg-app-yellow/10 border-app-yellow/20",
    iconColor: "text-app-yellow",
  },
];

export default function MetricCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, bg, iconColor }) => (
        <div
          key={key}
          className={`rounded-xl border p-4 ${bg}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-silver text-xs font-medium uppercase tracking-wide">
              {label}
            </span>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics[key].toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
