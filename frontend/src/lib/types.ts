// Types espelhando os schemas Pydantic do backend

export interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
}

export interface Experience {
  company: string;
  position: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  current: boolean;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  location?: string | null;
  start_date: string;
  end_date: string;
}

export interface Skills {
  technical: string[];
  tools: string[];
  soft: string[];
  categorized?: Record<string, string | string[]>;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string | null;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string | null;
}

export interface Language {
  language: string;
  proficiency: string;
}

export interface ResumeData {
  personal_info: PersonalInfo;
  summary?: string | null;
  experiences: Experience[];
  education: Education[];
  skills: Skills;
  certifications: Certification[];
  projects: Project[];
  languages: Language[];
  extracurricular_experiences?: Experience[];
}
