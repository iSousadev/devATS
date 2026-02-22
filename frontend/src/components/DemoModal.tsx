"use client";

import { useEffect, useRef } from "react";
import { X, FileText, Sparkles, Target, CheckCircle } from "lucide-react";
import Link from "next/link";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <FileText className="h-6 w-6 text-emerald-400" />,
      title: "Cole a vaga desejada",
      description:
        "Copie e cole a descrição da vaga que você quer se candidatar.",
    },
    {
      icon: <Sparkles className="h-6 w-6 text-purple-400" />,
      title: "IA analisa e adapta",
      description:
        "Nossa IA identifica as palavras-chave e adapta seu currículo automaticamente.",
    },
    {
      icon: <Target className="h-6 w-6 text-blue-400" />,
      title: "Otimizado para ATS",
      description:
        "O currículo é formatado para passar nos filtros automáticos dos recrutadores.",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-green-400" />,
      title: "Baixe e candidate-se",
      description: "Exporte em PDF profissional, pronto para enviar.",
    },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111111] shadow-2xl shadow-black/50 animate-[scaleIn_0.3s_ease-out]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/50 transition-colors duration-200 hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl border-b border-white/10 px-8 py-8">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-purple-500/10" />
          <div className="relative">
            <span className="mb-2 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              Demo Interativa
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Como o DevATS funciona
            </h2>
            <p className="mt-2 text-sm text-white/50">
              Veja como adaptar seu currículo em 4 passos simples
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="px-8 py-6 space-y-1">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 items-start group">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors duration-300 group-hover:bg-white/10 group-hover:border-white/20">
                  {step.icon}
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-px h-8 bg-linear-to-b from-white/20 to-transparent" />
                )}
              </div>

              {/* Content */}
              <div className="pt-2 pb-4">
                <h3 className="text-sm font-semibold text-white">
                  <span className="mr-2 text-white/30">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-white/40 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Preview mockup */}
        <div className="mx-8 mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-white/30 font-mono">
              devats.app/dashboard
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded-full bg-white/10 animate-pulse" />
            <div className="h-3 w-1/2 rounded-full bg-white/10 animate-pulse [animation-delay:0.1s]" />
            <div className="h-3 w-5/6 rounded-full bg-white/10 animate-pulse [animation-delay:0.2s]" />
            <div className="flex gap-2 mt-3">
              <div className="h-6 w-20 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
              <div className="h-6 w-16 rounded-md bg-white/5 border border-white/10" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-b-2xl border-t border-white/10 px-8 py-5 bg-white/2">
          <p className="text-xs text-white/30">
            Grátis para começar · Sem cartão de crédito
          </p>
          <Link
            href="/register"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-white/90 hover:shadow-lg hover:shadow-white/10"
          >
            Começar Agora
          </Link>
        </div>
      </div>
    </div>
  );
}
