import axios from 'axios'
import type { ResumeData } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const resumeAPI = {
  /** Faz upload e parse do PDF/DOCX → retorna texto bruto */
  parseResume: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/api/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data as { success: boolean; text: string; filename: string }
  },

  /** Envia texto bruto para Gemini → retorna ResumeData estruturado */
  extractData: async (text: string) => {
    const res = await api.post('/api/extract', { text })
    return res.data as { success: boolean; data: ResumeData }
  },

  /** Gera DOCX ATS-friendly → retorna Blob para download */
  generateResume: async (templateId: string, resumeData: ResumeData) => {
    const res = await api.post(
      '/api/generate',
      { template_id: templateId, resume_data: resumeData },
      { responseType: 'blob' }
    )
    return res.data as Blob
  },
}
