"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalculatorIcon, SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ENLACES = [
  { href: "/", texto: "Asistente IA", icono: SparklesIcon },
  { href: "/calculadora", texto: "Calculadora", icono: CalculatorIcon },
]

export function EncabezadoSitio() {
  const ruta = usePathname()
  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-violet-500 via-indigo-500 to-sky-500 text-xs font-bold text-white shadow-sm">
            P
          </span>
          <span>Presupuesta mi web</span>
        </Link>
        <nav aria-label="Secciones" className="flex items-center gap-1 text-sm">
          {ENLACES.map(({ href, texto, icono: Icono }) => {
            const activo = ruta === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10",
                  activo &&
                    "bg-white/70 text-foreground shadow-sm dark:bg-white/15"
                )}
              >
                <Icono className="size-4" />
                <span className="hidden sm:inline">{texto}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
