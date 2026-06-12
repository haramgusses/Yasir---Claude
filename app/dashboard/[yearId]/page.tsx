import { redirect } from "next/navigation";

export default function YearIndex({ params }: { params: { yearId: string } }) {
  redirect(`/dashboard/${params.yearId}/upload`);
}
