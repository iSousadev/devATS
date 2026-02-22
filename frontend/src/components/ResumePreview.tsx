"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ResumeData } from "@/lib/types";

interface ResumePreviewProps {
  data: ResumeData;
}

export function ResumePreview({ data }: ResumePreviewProps) {
  const {
    personal_info: p,
    summary,
    experiences,
    education,
    skills,
    projects,
    certifications,
    languages,
  } = data;

  return (
    <div className="space-y-6 text-sm font-mono bg-white dark:bg-zinc-900 rounded-xl border p-4 sm:p-8 shadow-sm">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">{p.full_name}</h2>
        <div className="text-muted-foreground mt-1 space-y-0.5">
          {p.email && <div>Email: {p.email}</div>}
          {p.phone && <div>Telefone: {p.phone}</div>}
          {p.location && <div>Local: {p.location}</div>}
          {p.linkedin && (
            <div className="break-all">LinkedIn: {p.linkedin}</div>
          )}
          {p.github && <div className="break-all">GitHub: {p.github}</div>}
        </div>
      </div>

      {summary && (
        <>
          <Separator />
          <section>
            <h3 className="font-bold uppercase tracking-wide mb-2">
              Resumo Profissional
            </h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {summary}
            </p>
          </section>
        </>
      )}

      {skills && (
        <>
          <Separator />
          <section>
            <h3 className="font-bold uppercase tracking-wide mb-2">
              Habilidades Técnicas
            </h3>
            {skills.categorized ? (
              <div className="space-y-1 text-muted-foreground">
                {Object.entries(skills.categorized).map(([key, value]) => {
                  const label: Record<string, string> = {
                    linguagens: "Linguagens",
                    frontend: "Frontend",
                    backend: "Backend",
                    frameworks: "Frameworks",
                    banco_de_dados: "Banco de Dados",
                    ferramentas: "Ferramentas",
                    praticas: "Práticas",
                  };
                  const text = Array.isArray(value)
                    ? value.join(", ")
                    : String(value ?? "");
                  if (!text) return null;
                  return (
                    <div key={key}>
                      {label[key] ?? key}: {text}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {[...skills.technical, ...skills.tools].map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {experiences.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="font-bold uppercase tracking-wide mb-3">
              Experiência Profissional
            </h3>
            <div className="space-y-4">
              {experiences.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between flex-wrap gap-1">
                    <span className="font-semibold">{exp.company}</span>
                    <span className="text-muted-foreground text-xs">
                      {exp.start_date} – {exp.current ? "Atual" : exp.end_date}
                    </span>
                  </div>
                  <div className="text-muted-foreground italic">
                    {exp.position}
                    {exp.location && ` · ${exp.location}`}
                  </div>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside text-muted-foreground">
                    {exp.achievements.map((a, j) => (
                      <li key={j}>{a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {education.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="font-bold uppercase tracking-wide mb-3">
              Formação Acadêmica
            </h3>
            <div className="space-y-2">
              {education.map((edu, i) => (
                <div key={i}>
                  <div className="font-semibold">{edu.degree}</div>
                  <div className="text-muted-foreground">
                    {edu.institution} · {edu.start_date} – {edu.end_date}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {projects.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="font-bold uppercase tracking-wide mb-3">Projetos</h3>
            <div className="space-y-3">
              {projects.map((proj, i) => (
                <div key={i}>
                  <div className="font-semibold">{proj.name}</div>
                  <div className="text-muted-foreground">
                    {proj.description}
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    Tecnologias: {proj.technologies.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {certifications.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="font-bold uppercase tracking-wide mb-2">
              Certificações
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {certifications.map((c, i) => (
                <li key={i}>
                  {c.name} — {c.issuer} ({c.date})
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {languages.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="font-bold uppercase tracking-wide mb-2">Idiomas</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {languages.map((l, i) => (
                <li key={i}>
                  {l.language} — {l.proficiency}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
