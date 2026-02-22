"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Terminal } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUser(data.user);
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) return null;

  const navLinks = [
    { href: "/dashboard", label: "Meus Currículos" },
    { href: "/dashboard/upload", label: "Adaptar Currículo" },
    { href: "/dashboard/create", label: "Criar do Zero" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-display text-slate-100">
      {/* Navbar */}
      <nav className="fixed top-5 left-0 right-0 mx-auto z-50 w-[92%] max-w-225 animate-[fadeSlideDown_0.5s_ease-out]">
        <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-white/5 px-7 backdrop-blur-xl shadow-lg shadow-black/20">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-white/80" />
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight text-white hover:text-white/90 transition-colors"
            >
              DevATS
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  pathname === l.href
                    ? "bg-white/10 text-white shadow-sm shadow-white/5"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-slate-500 hidden lg:block truncate max-w-40">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 pt-40 pb-12">{children}</main>
    </div>
  );
}
