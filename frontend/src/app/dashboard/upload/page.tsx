"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/FileUploader";
import { ResumePreview } from "@/components/ResumePreview";
import { TemplateSelector } from "@/components/TemplateSelector";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { sileo } from "sileo";
import { resumeAPI } from "@/lib/api";
import type { ResumeData } from "@/lib/types";

const STEP_LABELS = ["Upload", "Revisar", "Template", "Download"];

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [templateId, setTemplateId] = useState("template-frontend-jr");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleUploadSuccess = (data: ResumeData) => {
    setResumeData(data);
    setStep(1);
  };

  const handleGenerate = async () => {
    if (!resumeData) return;
    setGenerating(true);

    try {
      const blob = await resumeAPI.generateResume(templateId, resumeData);

      // Disparar download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personal_info.full_name.replace(/\s+/g, "_")}_ATS.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Salvar no Supabase (opcional — continua mesmo se falhar)
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          await supabase.from("resumes").insert({
            user_id: auth.user.id,
            title: `${resumeData.personal_info.full_name} — ${new Date().toLocaleDateString("pt-BR")}`,
            template_id: templateId,
            data: resumeData,
          });
        }
      } catch {
        /* silencioso */
      }

      setStep(3);
      setDone(true);

      sileo.success({
        title: "Currículo Gerado",
        description: "Seu currículo ATS foi gerado e baixado com sucesso!",
      });
    } catch (err: unknown) {
      const backendMsg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;

      sileo.error({
        title: "Erro ao Gerar Currículo",
        description:
          backendMsg ??
          "Não conseguimos gerar o currículo. Verifique se o backend está rodando e tente novamente.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i === step
                  ? "bg-blue-600 text-white"
                  : i < step
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden md:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className="w-8 h-px bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Adaptar Currículo</h1>
            <p className="text-muted-foreground mt-1">
              Faça upload do seu currículo atual. Pode ter colunas, foto,
              gráficos — nossa IA extrai tudo.
            </p>
          </div>
          <FileUploader onSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Step 1: Review */}
      {step === 1 && resumeData && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Revisar Dados Extraídos</h1>
            <p className="text-muted-foreground mt-1">
              Confira se a IA extraiu tudo corretamente.
            </p>
          </div>
          <ResumePreview data={resumeData} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button onClick={() => setStep(2)}>
              Continuar para Templates →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Template */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Escolher Template</h1>
            <p className="text-muted-foreground mt-1">
              Todos os templates são 100% ATS-friendly: 1 coluna, sem foto, sem
              gráficos.
            </p>
          </div>
          <TemplateSelector value={templateId} onChange={setTemplateId} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700"
            >
              {generating ? "Gerando DOCX..." : "Gerar Currículo ATS"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && done && (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-bold">Currículo gerado com sucesso!</h2>
          <p className="text-muted-foreground">
            O download do DOCX começou automaticamente.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Ver meus currículos
            </Button>
            <Button
              onClick={() => {
                setStep(0);
                setResumeData(null);
                setDone(false);
              }}
            >
              Adaptar outro currículo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
