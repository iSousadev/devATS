import { create } from 'zustand'
import type { ResumeData } from './types'

interface ResumeStore {
  resumeData: ResumeData | null
  rawText: string
  templateId: string
  setResumeData: (data: ResumeData) => void
  setRawText: (text: string) => void
  setTemplateId: (id: string) => void
  reset: () => void
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resumeData: null,
  rawText: '',
  templateId: 'template-frontend-jr',
  setResumeData: (data) => set({ resumeData: data }),
  setRawText: (text) => set({ rawText: text }),
  setTemplateId: (id) => set({ templateId: id }),
  reset: () => set({ resumeData: null, rawText: '', templateId: 'template-frontend-jr' }),
}))
