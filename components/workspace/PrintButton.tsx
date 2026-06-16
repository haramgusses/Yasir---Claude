"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PrintButton({ disabled }: { disabled?: boolean }) {
  return (
    <Button
      type="button"
      size="sm"
      disabled={disabled}
      onClick={() => window.print()}
      title={disabled ? "Resolve the items below first" : "Print or save as PDF"}>
      <Printer className="h-4 w-4" />
      Print draft
    </Button>
  );
}
