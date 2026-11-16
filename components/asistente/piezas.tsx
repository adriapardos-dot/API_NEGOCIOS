"use client"

import * as React from "react"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"

import { AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GlassAlert } from "@/components/ui/glasscn/glass-alert"
import { GlassButton } from "@/components/ui/glasscn/glass-button"
import { estiloAcento } from "@/lib/estilos"
import { cn } from "@/lib/utils"

// ---- Piezas compartidas por los pasos -------------------------------------

export function BotonPrincipal({
  children,
  cargando,
  className,
  ...props
}: React.ComponentProps<typeof GlassButton> & { cargando?: boolean }) {
  return (
    <GlassButton
      glassVariant="liquid"
      size="lg"
      {...props}
      className={cn(
        estiloAcento,
        "brillo-hover h-11 rounded-full px-6 text-sm font-semibold transition-[translate,scale,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgba(99,102,241,0.65)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60 motion-reduce:transition-none",
        className
      )}
    >
      {cargando ? <Loader2Icon className="animate-spin" /> : null}
      {children}
    </GlassButton>
  )
}

export function BotonSecundario({
  className,
  ...props
}: React.ComponentProps<typeof GlassButton>) {
  return (
    <GlassButton
      glassVariant="clear"
      size="lg"
      {...props}
      className={cn(
        "h-11 rounded-full px-5 text-sm font-medium hover:bg-white/50 dark:hover:bg-white/10",
        className
      )}
    />
  )
}

export function AlertaError({
  titulo,
  errores,
  accion,
}: {
  titulo: string
  errores: string[]
  accion?: React.ReactNode
}) {
  return (
    <GlassAlert
      glassVariant="frosted"
      role="alert"
      className="rounded-2xl px-4 py-3 text-destructive"
    >
      <AlertCircleIcon />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription className="text-destructive/90">
        <ul className="list-inside list-disc">
          {errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        {accion ? <div className="mt-3">{accion}</div> : null}
      </AlertDescription>
    </GlassAlert>
  )
}

export const panel =
  "rounded-2xl border border-white/60 bg-white/55 shadow-[0_2px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-slate-900/45"
