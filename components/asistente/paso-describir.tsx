"use client"

import * as React from "react"
import {
  ArrowRightIcon,
  CalculatorIcon,
  FileCheck2Icon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LIMITES_SOLICITUD } from "@/lib/solicitud"
import { cn } from "@/lib/utils"

import { AlertaError, BotonPrincipal, BotonSecundario, panel } from "./piezas"

// Datos ficticios para probar los distintos casos.
const EJEMPLOS = [
  {
    etiqueta: "Restaurante",
    cliente: "Restaurante La Brasa (ficticio)",
    descripcion:
      "Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas.",
  },
  {
    etiqueta: "Petición ambigua",
    cliente: "Ana Pérez (ficticio)",
    descripcion:
      "Quiero algo para internet para mi negocio, que quede bonito y moderno.",
  },
  {
    etiqueta: "Fuera de catálogo",
    cliente: "Moda Lúa S.L. (ficticio)",
    descripcion:
      "Queremos una tienda online para vender ropa con pago con tarjeta, un blog y posicionamiento SEO. También una página de contacto con formulario.",
  },
]

export function PasoDescribir({
  cliente,
  descripcion,
  onCliente,
  onDescripcion,
  onEnviar,
  analizando,
  error,
  hayPropuesta,
  onVolverAPropuesta,
}: {
  cliente: string
  descripcion: string
  onCliente: (v: string) => void
  onDescripcion: (v: string) => void
  onEnviar: () => void
  analizando: boolean
  error: { errores: string[]; reintentable: boolean } | null
  hayPropuesta: boolean
  onVolverAPropuesta: () => void
}) {
  const largo = descripcion.trim().length
  const max = LIMITES_SOLICITUD.descripcionMax
  const excedido = largo > max

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    onEnviar()
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
      <form
        onSubmit={enviar}
        noValidate
        className={cn(panel, "flex flex-col gap-6 p-6 sm:p-8")}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="cliente" className="text-sm font-medium">
            Nombre del cliente o empresa
          </label>
          <Input
            id="cliente"
            value={cliente}
            onChange={(e) => onCliente(e.target.value)}
            placeholder="Ej.: Restaurante La Brasa"
            maxLength={LIMITES_SOLICITUD.clienteMax + 20}
            autoComplete="organization"
            className="h-10 bg-white/70 dark:bg-white/5"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-3">
            <label htmlFor="descripcion" className="text-sm font-medium">
              ¿Qué necesitas?
            </label>
            <span
              className={cn(
                "text-xs text-muted-foreground tabular-nums",
                excedido && "font-medium text-destructive"
              )}
              aria-live="polite"
            >
              {largo.toLocaleString("es-ES")} / {max.toLocaleString("es-ES")}
            </span>
          </div>
          <Textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => onDescripcion(e.target.value)}
            placeholder="Ej.: Necesito una web para mi restaurante. Quiero mostrar la carta, un formulario para pedir reservas y que esté en castellano e inglés."
            aria-invalid={excedido || undefined}
            className="min-h-40 bg-white/70 leading-relaxed dark:bg-white/5"
          />
          <p className="text-xs text-muted-foreground">
            Cuenta a qué se dedica tu negocio, qué secciones imaginas y qué
            funciones necesitas. Usa datos ficticios en las pruebas.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Probar con un ejemplo
          </span>
          <div className="flex flex-wrap gap-2">
            {EJEMPLOS.map((ej) => (
              <button
                key={ej.etiqueta}
                type="button"
                onClick={() => {
                  onCliente(ej.cliente)
                  onDescripcion(ej.descripcion)
                }}
                className="rounded-full border border-indigo-200 bg-white/60 px-3 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-400/30 dark:bg-white/5 dark:text-indigo-200 dark:hover:bg-indigo-400/10"
              >
                {ej.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <AlertaError
            titulo={
              error.reintentable
                ? "No hemos podido preparar la propuesta"
                : "Revisa los datos"
            }
            errores={error.errores}
            accion={
              error.reintentable ? (
                <BotonSecundario
                  type="button"
                  onClick={onEnviar}
                  disabled={analizando}
                  className="h-9 text-destructive"
                >
                  <RotateCcwIcon />
                  Reintentar
                </BotonSecundario>
              ) : null
            }
          />
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          {hayPropuesta && (
            <BotonSecundario
              type="button"
              onClick={onVolverAPropuesta}
              disabled={analizando}
            >
              Volver a la propuesta actual
            </BotonSecundario>
          )}
          <BotonPrincipal
            type="submit"
            disabled={analizando}
            cargando={analizando}
          >
            {analizando ? (
              "Analizando tu proyecto…"
            ) : (
              <>
                <SparklesIcon />
                {hayPropuesta
                  ? "Generar una nueva propuesta"
                  : "Obtener propuesta"}
                <ArrowRightIcon />
              </>
            )}
          </BotonPrincipal>
        </div>
        {analizando && (
          <p
            className="text-right text-xs text-muted-foreground"
            aria-live="polite"
          >
            El asistente está comparando tu descripción con nuestro catálogo.
            Suele tardar unos segundos.
          </p>
        )}
      </form>

      <aside className={cn(panel, "flex flex-col gap-5 p-6 sm:p-7")}>
        <h2 className="text-sm font-semibold">Cómo funciona</h2>
        <ol className="flex flex-col gap-4">
          <Paso
            icono={<SparklesIcon />}
            titulo="La IA interpreta tu solicitud"
            texto="Relaciona lo que describes con los servicios de nuestro catálogo y señala lo que haya que aclarar."
          />
          <Paso
            icono={<CalculatorIcon />}
            titulo="Tú revisas y el servidor calcula"
            texto="Acepta, quita o añade servicios. Los importes salen siempre de nuestras tarifas, nunca de la IA."
          />
          <Paso
            icono={<FileCheck2Icon />}
            titulo="Descargas el presupuesto"
            texto="Revisa el documento y descárgalo en PDF con el desglose y los puntos pendientes."
          />
        </ol>
        <div className="flex gap-2.5 rounded-xl border border-emerald-300/50 bg-emerald-50/60 p-3 text-xs text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
          <ShieldCheckIcon className="size-4 shrink-0" />
          <p>
            La IA no fija precios ni plazos: solo propone servicios existentes.
            Lo que no ofrecemos queda marcado como pendiente de valorar.
          </p>
        </div>
      </aside>
    </div>
  )
}

function Paso({
  icono,
  titulo,
  texto,
}: {
  icono: React.ReactNode
  titulo: string
  texto: string
}) {
  return (
    <li className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300 [&_svg]:size-4">
        {icono}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{titulo}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {texto}
        </span>
      </span>
    </li>
  )
}
