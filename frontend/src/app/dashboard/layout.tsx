"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Terminal, Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUser(data.user);
    });
  }, [router]);

  // Fecha menu ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
        <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 md:px-7 backdrop-blur-xl shadow-lg shadow-black/20">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-white/80" />
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight text-white hover:text-white/90 transition-colors"
            >
              DevATS
            </Link>
          </div>

          {/* Links desktop */}
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

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden lg:block truncate max-w-40">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="hidden md:block text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-white"
            >
              Sair
            </button>
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Dropdown mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-white/10 bg-[#111] backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden animate-[fadeSlideDown_0.2s_ease-out]">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block px-5 py-3.5 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                  pathname === l.href
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="px-5 py-3.5 border-t border-white/10">
              <p className="text-xs text-slate-500 mb-2 truncate">
                {user.email}
              </p>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 md:pt-36 lg:pt-40 pb-12">
        {children}
      </main>
    </div>
  );
}
