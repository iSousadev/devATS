"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sileo } from "sileo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";

interface ResumeData {
  personal_info: {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  experiences?: Array<{
    company: string;
    position: string;
    period: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    period: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    institution: string;
    date: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency: string;
  }>;
}

interface Resume {
  id: string;
  title: string;
  template_id: string;
  created_at: string;
  file_url: string | null;
  data?: ResumeData;
}

const templateLabel: Record<string, string> = {
  "template-frontend-jr": "Frontend Júnior",
  "template-frontend": "Frontend",
  "template-backend": "Backend",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: rows } = await supabase
      .from("resumes")
      .select("id, title, template_id, created_at, file_url, data")
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false });
    setResumes(rows ?? []);
    setLoading(false);
  };

  const handleDownload = async (resume: Resume) => {
    setIsDownloading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/generate`,
        {
          template_id: resume.template_id,
          data: resume.data,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${resume.title}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      sileo.success({
        title: "Download Iniciado",
        description: "Seu currículo está sendo baixado.",
      });
    } catch (error) {
      console.error("Erro ao baixar:", error);
      sileo.error({
        title: "Erro ao Baixar",
        description: "Não conseguimos baixar o currículo. Tente novamente.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este currículo?")) return;

    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (error) {
      sileo.error({
        title: "Erro ao Deletar",
        description: "Não conseguimos deletar o currículo. Tente novamente.",
      });
      return;
    }

    setResumes((prev) => prev.filter((r) => r.id !== id));
    setSelectedResume(null);

    sileo.success({
      title: "Currículo Deletado",
      description: "O currículo foi removido com sucesso.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Currículos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus currículos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/create">Criar do Zero</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/upload">Adaptar Currículo</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-xl font-medium mb-2">Nenhum currículo ainda</p>
          <p className="text-muted-foreground mb-6">
            Adapte seu currículo atual ou crie um do zero.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard/create">Criar do Zero</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/upload">Adaptar Currículo</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-zinc-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold truncate">{r.title}</h3>
                <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                  {templateLabel[r.template_id] ?? r.template_id}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {new Date(r.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedResume(r)}
                    >
                      Ver Detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{selectedResume?.title}</DialogTitle>
                      <DialogDescription>
                        Criado em{" "}
                        {selectedResume &&
                          new Date(
                            selectedResume.created_at,
                          ).toLocaleDateString("pt-BR")}
                      </DialogDescription>
                    </DialogHeader>

                    {selectedResume?.data && (
                      <div className="space-y-6 mt-4">
                        {/* Informações Pessoais */}
                        <div>
                          <h3 className="font-semibold mb-2 text-lg">
                            📋 Informações Pessoais
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {selectedResume.data.personal_info?.full_name && (
                              <p>
                                <strong>Nome:</strong>{" "}
                                {selectedResume.data.personal_info.full_name}
                              </p>
                            )}
                            {selectedResume.data.personal_info?.email && (
                              <p>
                                <strong>Email:</strong>{" "}
                                {selectedResume.data.personal_info.email}
                              </p>
                            )}
                            {selectedResume.data.personal_info?.phone && (
                              <p>
                                <strong>Telefone:</strong>{" "}
                                {selectedResume.data.personal_info.phone}
                              </p>
                            )}
                            {selectedResume.data.personal_info?.location && (
                              <p>
                                <strong>Localização:</strong>{" "}
                                {selectedResume.data.personal_info.location}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Resumo */}
                        {selectedResume.data.summary && (
                          <div>
                            <h3 className="font-semibold mb-2 text-lg">
                              💼 Resumo Profissional
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedResume.data.summary}
                            </p>
                          </div>
                        )}

                        {/* Experiências */}
                        {selectedResume.data.experiences &&
                          selectedResume.data.experiences.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 text-lg">
                                🏢 Experiências
                              </h3>
                              <div className="space-y-3">
                                {selectedResume.data.experiences.map(
                                  (exp, i) => (
                                    <div key={i} className="border-l-2 pl-3">
                                      <p className="font-medium">
                                        {exp.position}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {exp.company} • {exp.period}
                                      </p>
                                      <p className="text-sm mt-1">
                                        {exp.description}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {/* Formação */}
                        {selectedResume.data.education &&
                          selectedResume.data.education.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 text-lg">
                                🎓 Formação
                              </h3>
                              <div className="space-y-2">
                                {selectedResume.data.education.map((edu, i) => (
                                  <div key={i}>
                                    <p className="font-medium">{edu.degree}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {edu.institution} • {edu.period}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Habilidades */}
                        {selectedResume.data.skills &&
                          selectedResume.data.skills.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 text-lg">
                                ⚡ Habilidades
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {selectedResume.data.skills.map((skill, i) => (
                                  <Badge key={i} variant="outline">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-6 pt-4 border-t">
                      <Button
                        onClick={() =>
                          selectedResume && handleDownload(selectedResume)
                        }
                        disabled={isDownloading}
                        className="flex-1"
                      >
                        {isDownloading ? "Baixando..." : "Baixar DOCX"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          selectedResume && handleDelete(selectedResume.id)
                        }
                      >
                        Deletar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {r.file_url && (
                  <a
                    href={r.file_url}
                    download
                    className="flex-1 text-center text-sm border rounded-lg px-3 py-1.5 hover:bg-muted transition"
                  >
                    Baixar
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
