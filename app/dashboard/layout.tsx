import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import Background from "@/components/fx/Background";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen print:bg-white">
      <Background />
      <div className="relative z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-performa-cyan/60 to-transparent print:hidden" />
        <header className="glass sticky top-0 z-50 border-x-0 border-t-0 print:hidden">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link href="/dashboard" aria-label="Performa home" className="press">
              <Logo light />
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
