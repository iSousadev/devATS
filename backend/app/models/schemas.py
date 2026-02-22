from pydantic import BaseModel, EmailStr, Field, HttpUrl


class PersonalInfo(BaseModel):
    full_name: str
    headline: str | None = None
    email: EmailStr
    phone: str
    location: str
    linkedin: HttpUrl | None = None
    github: HttpUrl | None = None
    portfolio: HttpUrl | None = None


class Experience(BaseModel):
    company: str
    position: str
    location: str | None = None
    start_date: str  # YYYY-MM
    end_date: str | None = None  # YYYY-MM or "Atual"
    current: bool = False
    achievements: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str
    degree: str
    location: str | None = None
    start_date: str  # YYYY
    end_date: str | None = None  # YYYY (optional for in-progress)


class Skills(BaseModel):
    technical: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    soft: list[str] = Field(default_factory=list)
    categorized: dict[str, str] = Field(default_factory=dict)


class Certification(BaseModel):
    name: str
    issuer: str
    date: str
    url: HttpUrl | None = None


class Project(BaseModel):
    name: str
    description: str
    highlights: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    url: HttpUrl | None = None


class Language(BaseModel):
    language: str
    proficiency: str


class ResumeData(BaseModel):
    personal_info: PersonalInfo
    summary: str | None = None
    experiences: list[Experience] = Field(default_factory=list)
    extracurricular_experiences: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    skills: Skills
    certifications: list[Certification] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    languages: list[Language] = Field(default_factory=list)


class GenerateRequest(BaseModel):
    template_id: str
    resume_data: ResumeData


class GenerateFromExtractRequest(BaseModel):
    # Optional here for compatibility with direct /api/extract payloads.
    template_id: str | None = None
    success: bool | None = None
    data: ResumeData
    message: str | None = None
