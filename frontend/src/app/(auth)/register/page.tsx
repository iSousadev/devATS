'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const schema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Senhas não coincidem',
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email, password, full_name }: FormData) => {
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } },
      })
      if (err) { setError(err.message); return }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-md text-center p-8">
        <p className="text-2xl mb-2">Conta criada!</p>
        <p className="text-muted-foreground mb-4">Verifique seu e-mail para confirmar a conta.</p>
        <Button onClick={() => router.push('/login')}>Ir para login</Button>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>Grátis, sem cartão de crédito</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input id="confirm" type="password" {...register('confirm')} />
            {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando...' : 'Criar conta'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Já tem conta? <Link href="/login" className="underline font-medium">Entrar</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
