"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NewYearButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    let res: Response;
    try {
      res = await fetch("/api/years", { method: "POST" });
    } catch {
      toast.error("Couldn't reach the server — check your connection and try again.");
      return;
    } finally {
      setBusy(false);
    }
    if (!res.ok) {
      toast.error("Couldn't start a new year — please try again.");
      return;
    }
    const { yearId } = await res.json();
    // Refresh the router cache so navigating back to the dashboard shows the
    // new year instead of a stale pre-creation list.
    router.refresh();
    router.push(`/dashboard/${yearId}/upload`);
  }

  return (
    <Button variant="outline" onClick={create} loading={busy}>
      <CalendarPlus className="h-4 w-4" /> Start next year
    </Button>
  );
}
