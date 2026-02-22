"use client";

import { useState } from "react";
import { ArrowRight, Code, Lock, Terminal, Menu, X } from "lucide-react";
import Link from "next/link";
import DemoModal from "@/components/DemoModal";

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#0a0a0a] font-display text-slate-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-4 left-0 right-0 mx-auto z-50 w-[90%] max-w-175 animate-[fadeSlideDown_0.5s_ease-out]">
        <div className="flex h-12 items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 sm:px-5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-white/80" />
            <span className="text-xl font-semibold tracking-tight text-white">
              DevATS
            </span>
          </div>
          {/* Links desktop */}
          <div className="hidden sm:flex items-center gap-3 sm:gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
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

      {/* Hero Section */}
      <main className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden pt-20 overflow-x-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 z-0 hero-glow pointer-events-none" />

        {/* Extra glow blobs for depth */}
        <div className="absolute -top-50 -right-25 w-175 h-175 bg-brand/20 rounded-full blur-[150px] pointer-events-none z-0" />
        <div className="absolute -bottom-37.5 -left-25 w-125 h-125 bg-purple-600/15 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-150 bg-brand/10 rounded-full blur-[180px] pointer-events-none z-0" />

        <div className="relative z-10 px-6 py-20 lg:px-12 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Column: Copy */}
            <div className="flex flex-col gap-8 max-w-2xl">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
                Hackeando o <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-slate-500">
                  Algoritmo ATS
                </span>
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                A IA que otimiza seu currículo para quem fala código. Transforme
                seu histórico de{" "}
                <span className="font-mono text-brand bg-brand/10 px-1 rounded">
                  git commit
                </span>{" "}
                em um currículo que as empresas de tecnologia querem ver.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/register"
                  className="group relative flex items-center gap-3 overflow-hidden rounded-md bg-brand px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-brand-dark glow-effect"
                >
                  <span className="relative z-10">
                    Comece a construir gratuitamente
                  </span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 z-0 bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="flex items-center gap-2 rounded-md border border-slate-700 bg-[#111111] px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-slate-800 hover:border-slate-600"
                >
                  <Code className="h-5 w-5 text-slate-400" />
                  Ver Demo
                </button>
              </div>
            </div>

            {/* Right Column: Resume Preview */}
            <div
              className="relative w-full flex justify-center lg:justify-end"
              style={{ perspective: "1000px" }}
            >
              {/* Resume Card Container */}
              <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-125">
                {/* Glow behind the card */}
                <div className="absolute -inset-4 bg-linear-to-r from-brand/30 to-purple-600/20 rounded-2xl blur-2xl opacity-50 z-0" />

                {/* Resume Document */}
                <div className="bg-[#161616] text-slate-900 rounded-lg shadow-2xl overflow-hidden transform -rotate-2 transition-transform hover:rotate-0 duration-500 origin-bottom-right h-96 sm:h-[30rem] lg:h-150 flex flex-col relative z-10 border border-slate-800">
                  {/* Window Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 bg-[#161616] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80 border border-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80 border border-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80 border border-green-500" />
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-black/40 px-3 py-1">
                      <Lock className="h-3 w-3 text-slate-500" />
                      <span className="text-xs font-mono text-slate-400">
                        senior_dev_resume.docx
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 font-mono">
                      TypeScript
                    </span>
                  </div>

                  {/* Resume Content (white area) */}
                  <div className="bg-slate-100 flex-1 flex flex-col overflow-hidden">
                    {/* Resume Header */}
                    <div className="px-8 py-8 border-b border-slate-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-serif font-bold text-slate-900">
                            Rodolfo Sousa
                          </h3>
                          <p className="text-brand font-medium mt-1">
                            Desenvolvedor Full Stack Júnior
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500 leading-relaxed">
                          test@test.com
                          <br />
                          github.com/test
                          <br />
                          (99) 91234-4321
                        </div>
                      </div>
                    </div>

                    {/* Resume Body */}
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                      {/* Section: Resumo */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-200 pb-1">
                          Resumo Profissional
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Desenvolvedor em formação (Sistemas de Informação – 5º
                          período), com experiência em projetos institucionais,
                          acadêmicos e pessoais. Perfil colaborativo, com foco
                          em automação, qualidade e boas práticas.
                        </p>
                      </div>

                      {/* Section: Habilidades */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-200 pb-1">
                          Habilidades Técnicas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            PHP 8+
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            JavaScript
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            TypeScript
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            Python
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            React
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            Next.js
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            Node.js
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            MySQL
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                            PostgreSQL
                          </span>
                          <span className="px-2 py-1 bg-brand/10 text-brand font-bold text-[10px] font-mono rounded border border-brand/20">
                            APIs REST
                          </span>
                        </div>
                      </div>

                      {/* Section: Experience */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-200 pb-1">
                          Experiência Profissional
                        </h4>
                        <div className="mb-4">
                          <div className="flex justify-between items-baseline mb-1">
                            <h5 className="font-bold text-slate-800">
                              Dev Tech
                            </h5>
                            <span className="text-xs text-slate-500 font-mono">
                              Set 2024 - Atual
                            </span>
                          </div>
                          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 ml-1 marker:text-brand">
                            <li>
                              Bolsista no PROINTER/PROINT, desenvolvimento de
                              sistemas internos.
                            </li>
                            <li>Foco em backend com ScriptCase e PHP.</li>
                            <li>
                              Criação de módulo de banco de questões para
                              docentes.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Underlay Card for depth */}
                <div className="absolute top-4 left-4 w-full h-full bg-[#1c1824] border border-white/10 rounded-lg -z-10" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Modal */}
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
