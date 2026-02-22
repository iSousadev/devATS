import Link from "next/link";
import { Terminal } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-display text-slate-100 flex items-center justify-center p-4">
      {/* Navbar */}
      <nav className="fixed top-5 left-0 right-0 mx-auto z-50 w-[90%] max-w-175 animate-[fadeSlideDown_0.5s_ease-out]">
        <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-white/5 px-7 backdrop-blur-xl shadow-lg shadow-black/20">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-white/80" />
            <Link href="/" className="text-lg font-semibold tracking-tight text-white hover:text-white/90 transition-colors">
              DevATS
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-slate-400 transition-colors duration-300 hover:text-white"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {children}
    </div>
  )
}
