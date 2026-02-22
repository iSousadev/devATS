"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { resumeAPI } from "@/lib/api";
import type { ResumeData } from "@/lib/types";
import { sileo } from "sileo";

interface FileUploaderProps {
  onSuccess: (data: ResumeData, text: string) => void;
}

const STEPS = [
  { label: "Extraindo texto...", value: 33 },
  { label: "Analisando com IA (10–20 s)...", value: 66 },
  { label: "Concluído!", value: 100 },
];

export function FileUploader({ onSuccess }: FileUploaderProps) {
  const [stepIndex, setStepIndex] = useState(-1);

  const isLoading = stepIndex >= 0 && stepIndex < 2;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setStepIndex(0);

      try {
        const parseResult = await resumeAPI.parseResume(file);
        setStepIndex(1);

        const extractResult = await resumeAPI.extractData(parseResult.text);
        setStepIndex(2);

        setTimeout(() => {
          setStepIndex(-1);
          onSuccess(extractResult.data, parseResult.text);
        }, 800);
      } catch (err: unknown) {
        setStepIndex(-1);

        // Pega a mensagem do backend
        const backendMsg = (
          err as { response?: { data?: { detail?: string } } }
        )?.response?.data?.detail;

        // Exibe toast de erro
        sileo.error({
          title: "Erro ao Processar Currículo",
          description:
            backendMsg ||
            "Não conseguimos processar seu currículo. Tente novamente em alguns minutos.",
          duration: 5000,
        });
      }
    },
    [onSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: isLoading,
  });

  const currentStep = stepIndex >= 0 ? STEPS[stepIndex] : null;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-muted-foreground/30 hover:border-muted-foreground/60"}
          ${isLoading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        {currentStep ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="font-medium">{currentStep.label}</p>
            <Progress value={currentStep.value} className="max-w-xs mx-auto" />
          </div>
        ) : (
          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-lg font-medium">
              {isDragActive
                ? "Solte o arquivo aqui"
                : "Arraste seu currículo ou clique para selecionar"}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF ou DOCX · máx. 5 MB
            </p>
            <p className="text-xs text-muted-foreground/70">
              Pode ter colunas, foto, gráficos — a IA extrai tudo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
