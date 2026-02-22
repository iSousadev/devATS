"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TemplateSelector } from "@/components/TemplateSelector";
import { ResumePreview } from "@/components/ResumePreview";
import { resumeAPI } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { ResumeData } from "@/lib/types";

const STEPS = [
  "Dados Pessoais",
  "Resumo & Skills",
  "Experiências",
  "Formação",
  "Template",
];

// ── Step 1 schema ───────────────────────────────────────────────────────────
const personalSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  telefone: z.string().min(8),
  location: z.string().min(3),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

// ── Step 2 schema ───────────────────────────────────────────────────────────
const summarySchema = z.object({
  summary: z.string().min(30, "Resumo muito curto"),
  technical: z.string(),
  soft: z.string(),
});

// ── Step 3 schema ───────────────────────────────────────────────────────────
const expSchema = z.object({
  company: z.string().min(2),
  position: z.string().min(2),
  location: z.string().optional(),
  start_date: z.string().min(4),
  end_date: z.string().optional(),
  current: z.boolean().optional(),
  achievements: z.string().min(10, "Descreva ao menos uma conquista"),
});

// ── Step 4 schema ───────────────────────────────────────────────────────────
const eduSchema = z.object({
  institution: z.string().min(3),
  degree: z.string().min(5),
  start_date: z.string().min(4),
  end_date: z.string().min(4),
});

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState("template-frontend-jr");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // accumulated resume data
  const [personalData, setPersonalData] = useState<z.infer<
    typeof personalSchema
  > | null>(null);
  const [summaryData, setSummaryData] = useState<z.infer<
    typeof summarySchema
  > | null>(null);
  const [experiences, setExperiences] = useState<
    Array<z.infer<typeof expSchema>>
  >([]);
  const [educations, setEducations] = useState<
    Array<z.infer<typeof eduSchema>>
  >([]);

  // ── forms ──────────────────────────────────────────────────────────────────
  const personal = useForm<z.infer<typeof personalSchema>>({
    resolver: zodResolver(personalSchema),
  });
  const summary = useForm<z.infer<typeof summarySchema>>({
    resolver: zodResolver(summarySchema),
  });
  const exp = useForm<z.infer<typeof expSchema>>({
    resolver: zodResolver(expSchema),
  });
  const edu = useForm<z.infer<typeof eduSchema>>({
    resolver: zodResolver(eduSchema),
  });

  // ── build ResumeData ───────────────────────────────────────────────────────
  const buildResumeData = (): ResumeData => ({
    personal_info: {
      full_name: personalData!.full_name,
      email: personalData!.email,
      phone: personalData!.telefone,
      location: personalData!.location,
      linkedin: personalData!.linkedin || null,
      github: personalData!.github || null,
    },
    summary: summaryData?.summary ?? null,
    experiences: experiences.map((e) => ({
      company: e.company,
      position: e.position,
      location: e.location ?? null,
      start_date: e.start_date,
      end_date: e.end_date ?? null,
      current: e.current ?? false,
      achievements: e.achievements
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
    })),
    education: educations.map((ed) => ({
      institution: ed.institution,
      degree: ed.degree,
      start_date: ed.start_date,
      end_date: ed.end_date,
      location: null,
    })),
    skills: {
      technical:
        summaryData?.technical
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) ?? [],
      tools: [],
      soft:
        summaryData?.soft
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) ?? [],
    },
    certifications: [],
    projects: [],
    languages: [],
  });

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const data = buildResumeData();
      const blob = await resumeAPI.generateResume(templateId, data);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.personal_info.full_name.replace(/\s+/g, "_")}_ATS.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          await supabase.from("resumes").insert({
            user_id: auth.user.id,
            title: `${data.personal_info.full_name} — ${new Date().toLocaleDateString("pt-BR")}`,
            template_id: templateId,
            data,
          });
        }
      } catch {
        /* silencioso */
      }

      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(msg ?? "Erro ao gerar. Verifique se o backend está rodando.");
    } finally {
      setGenerating(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold">Currículo criado com sucesso!</h2>
        <p className="text-muted-foreground">
          O download iniciou automaticamente.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Ver meus currículos
          </Button>
          <Button
            onClick={() => {
              setStep(0);
              setDone(false);
              setPersonalData(null);
              setExperiences([]);
              setEducations([]);
            }}
          >
            Criar outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Stepper — compacto em mobile, expandido em sm+ */}
      <div className="flex items-center gap-1">
        {/* Mobile: indicador textual */}
        <div className="flex sm:hidden items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-blue-600 text-white`}
          >
            {step < STEPS.length - 1 ? step + 1 : "✓"}
          </div>
          <span className="text-sm font-medium">
            {STEPS[step]}
            <span className="text-muted-foreground ml-1">
              ({step + 1}/{STEPS.length})
            </span>
          </span>
        </div>
        {/* Desktop: todos os steps */}
        <div className="hidden sm:flex items-center gap-1 flex-wrap">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
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
                className={`text-xs font-medium ${i === step ? "" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-4 h-px bg-border mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Dados Pessoais */}
      {step === 0 && (
        <form
          onSubmit={personal.handleSubmit((d) => {
            setPersonalData(d);
            setStep(1);
          })}
          className="space-y-4"
        >
          <h1 className="text-2xl font-bold">Dados Pessoais</h1>
          {(
            [
              "full_name",
              "email",
              "telefone",
              "location",
              "linkedin",
              "github",
            ] as const
          ).map((field) => (
            <div key={field} className="space-y-1">
              <Label htmlFor={field}>
                {field === "full_name"
                  ? "Nome completo"
                  : field === "linkedin"
                    ? "LinkedIn (opcional)"
                    : field === "github"
                      ? "GitHub (opcional)"
                      : field.charAt(0).toUpperCase() + field.slice(1)}
              </Label>
              <Input id={field} {...personal.register(field)} />
              {personal.formState.errors[field] && (
                <p className="text-xs text-red-500">
                  {personal.formState.errors[field]?.message as string}
                </p>
              )}
            </div>
          ))}
          <Button type="submit" className="w-full">
            Continuar →
          </Button>
        </form>
      )}

      {/* Step 1: Resumo & Skills */}
      {step === 1 && (
        <form
          onSubmit={summary.handleSubmit((d) => {
            setSummaryData(d);
            setStep(2);
          })}
          className="space-y-4"
        >
          <h1 className="text-2xl font-bold">Resumo e Habilidades</h1>
          <div className="space-y-1">
            <Label htmlFor="summary">Resumo Profissional</Label>
            <Textarea
              id="summary"
              rows={5}
              placeholder="Desenvolvedor em formação com experiência em..."
              {...summary.register("summary")}
            />
            {summary.formState.errors.summary && (
              <p className="text-xs text-red-500">
                {summary.formState.errors.summary.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="technical">
              Skills Técnicas (separadas por vírgula)
            </Label>
            <Input
              id="technical"
              placeholder="JavaScript, React, Python, Node.js"
              {...summary.register("technical")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="soft">Soft Skills (separadas por vírgula)</Label>
            <Input
              id="soft"
              placeholder="Trabalho em equipe, Comunicação"
              {...summary.register("soft")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button type="submit">Continuar →</Button>
          </div>
        </form>
      )}

      {/* Step 2: Experiências */}
      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Experiências Profissionais</h1>

          {experiences.length > 0 && (
            <div className="space-y-2">
              {experiences.map((e, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-muted rounded-lg px-4 py-2 text-sm"
                >
                  <span>
                    {e.position} @ {e.company}
                  </span>
                  <button
                    className="text-red-500 hover:underline text-xs"
                    onClick={() =>
                      setExperiences(experiences.filter((_, j) => j !== i))
                    }
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={exp.handleSubmit((d) => {
              setExperiences([...experiences, d]);
              exp.reset();
            })}
            className="space-y-4 border rounded-xl p-3 sm:p-5"
          >
            <p className="font-medium text-sm text-muted-foreground">
              Adicionar experiência
            </p>
            {(
              [
                "company",
                "position",
                "location",
                "start_date",
                "end_date",
              ] as const
            ).map((f) => (
              <div key={f} className="space-y-1">
                <Label htmlFor={f}>
                  {f === "start_date"
                    ? "Início (ex: Set 2023)"
                    : f === "end_date"
                      ? "Fim (ex: Atual ou Dez 2024)"
                      : f === "location"
                        ? "Local (opcional)"
                        : f.charAt(0).toUpperCase() + f.slice(1)}
                </Label>
                <Input id={f} {...exp.register(f)} />
              </div>
            ))}
            <div className="space-y-1">
              <Label htmlFor="achievements">Conquistas (uma por linha)</Label>
              <Textarea
                id="achievements"
                rows={4}
                placeholder="- Desenvolvi feature X que reduziu Y&#10;- Integrei API de Z"
                {...exp.register("achievements")}
              />
              {exp.formState.errors.achievements && (
                <p className="text-xs text-red-500">
                  {exp.formState.errors.achievements.message}
                </p>
              )}
            </div>
            <Button type="submit" variant="outline" className="w-full">
              + Adicionar Experiência
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button onClick={() => setStep(3)}>Continuar →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Formação */}
      {step === 3 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Formação Acadêmica</h1>

          {educations.length > 0 && (
            <div className="space-y-2">
              {educations.map((e, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-muted rounded-lg px-4 py-2 text-sm"
                >
                  <span>
                    {e.degree} — {e.institution}
                  </span>
                  <button
                    className="text-red-500 hover:underline text-xs"
                    onClick={() =>
                      setEducations(educations.filter((_, j) => j !== i))
                    }
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={edu.handleSubmit((d) => {
              setEducations([...educations, d]);
              edu.reset();
            })}
            className="space-y-4 border rounded-xl p-3 sm:p-5"
          >
            <p className="font-medium text-sm text-muted-foreground">
              Adicionar formação
            </p>
            {(["institution", "degree", "start_date", "end_date"] as const).map(
              (f) => (
                <div key={f} className="space-y-1">
                  <Label htmlFor={f}>
                    {f === "start_date"
                      ? "Ano de início (ex: 2022)"
                      : f === "end_date"
                        ? "Ano de conclusão (ex: 2026)"
                        : f === "institution"
                          ? "Instituição"
                          : "Curso / Grau"}
                  </Label>
                  <Input id={f} {...edu.register(f)} />
                  {edu.formState.errors[f] && (
                    <p className="text-xs text-red-500">
                      {edu.formState.errors[f]?.message as string}
                    </p>
                  )}
                </div>
              ),
            )}
            <Button type="submit" variant="outline" className="w-full">
              + Adicionar Formação
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={educations.length === 0}
            >
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Template + Preview + Gerar */}
      {step === 4 && personalData && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Escolher Template</h1>
          <TemplateSelector value={templateId} onChange={setTemplateId} />

          <div>
            <h2 className="text-lg font-semibold mb-3">Preview</h2>
            <ResumePreview data={buildResumeData()} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>
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
    </div>
  );
}
