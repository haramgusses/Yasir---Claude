import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Package } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-app-black">
      <header className="border-b border-navy bg-navy/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-burgundy rounded-lg p-1.5 group-hover:bg-burgundy/80 transition-colors">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-none">ShipQR</div>
              <div className="text-silver text-xs leading-none mt-0.5">
                Logistics Platform
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-silver text-sm hidden sm:block">Internal Dashboard</span>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
