'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  description: string
  tags: string[]
}

const TEMPLATES: Template[] = [
  {
    id: 'template-frontend-jr',
    name: 'Frontend Júnior',
    description: 'Ideal para devs em início de carreira. Destaca projetos, formação e habilidades técnicas.',
    tags: ['1 coluna', 'ATS-friendly', 'Júnior'],
  },
  {
    id: 'template-frontend',
    name: 'Frontend Pleno/Sênior',
    description: 'Para devs experientes. Foco em experiências e resultados quantificáveis.',
    tags: ['1 coluna', 'ATS-friendly', 'Pleno/Sênior'],
  },
  {
    id: 'template-backend',
    name: 'Backend',
    description: 'Otimizado para backend e fullstack. Seções de arquitetura, APIs e banco de dados.',
    tags: ['1 coluna', 'ATS-friendly', 'Backend'],
  },
]

interface TemplateSelectorProps {
  value: string
  onChange: (id: string) => void
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onChange(tpl.id)}
          className={cn(
            'text-left rounded-xl border-2 p-5 transition-all hover:shadow-md',
            value === tpl.id
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
              : 'border-border hover:border-muted-foreground/60'
          )}
        >
          {/* Miniatura ilustrativa */}
          <div className="w-full h-28 rounded-lg bg-muted mb-4 flex flex-col gap-1 p-3 overflow-hidden">
            <div className="h-3 w-1/2 bg-foreground/20 rounded" />
            <div className="h-2 w-3/4 bg-foreground/10 rounded" />
            <div className="h-2 w-2/3 bg-foreground/10 rounded" />
            <div className="mt-2 h-2 w-1/3 bg-blue-400/40 rounded" />
            <div className="h-2 w-full bg-foreground/10 rounded" />
            <div className="h-2 w-full bg-foreground/10 rounded" />
            <div className="h-2 w-4/5 bg-foreground/10 rounded" />
          </div>

          <p className="font-semibold mb-1">{tpl.name}</p>
          <p className="text-xs text-muted-foreground mb-3">{tpl.description}</p>
          <div className="flex flex-wrap gap-1">
            {tpl.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
