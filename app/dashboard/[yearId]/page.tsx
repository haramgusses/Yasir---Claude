import { redirect, notFound } from "next/navigation";
import { requireYear, yearProgress } from "@/lib/years";

// Land people on whatever step needs them next, not always the beginning.
export default async function YearIndex({ params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();
  const p = await yearProgress(year.id);
  redirect(`/dashboard/${params.yearId}/${p.nextStep}`);
}
