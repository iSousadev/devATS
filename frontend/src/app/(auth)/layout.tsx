"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Menu, X } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-display text-slate-100 flex items-center justify-center p-4">
      {/* Navbar */}
      <nav className="fixed top-5 left-0 right-0 mx-auto z-50 w-[90%] max-w-175 animate-[fadeSlideDown_0.5s_ease-out]">
        <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 sm:px-7 backdrop-blur-xl shadow-lg shadow-black/20">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-white/80" />
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white hover:text-white/90 transition-colors"
            >
              DevATS
            </Link>
          </div>

          {/* Links desktop */}
          <div className="hidden sm:flex items-center gap-3 sm:gap-6">
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors duration-300 ${pathname === "/login" ? "text-white" : "text-slate-400 hover:text-white"}`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`text-sm font-medium transition-colors duration-300 ${pathname === "/register" ? "text-white" : "text-slate-400 hover:text-white"}`}
            >
              Criar Conta
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Dropdown mobile */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-2 rounded-2xl border border-white/10 bg-[#111] backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Criar Conta
            </Link>
          </div>
        )}
      </nav>

      {children}
    </div>
  );
}
