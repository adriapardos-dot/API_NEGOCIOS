"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  RotateCcwIcon,
} from "lucide-react"

import type { PresupuestoDetallado } from "@/lib/seleccion"
import { cn } from "@/lib/utils"

import { AlertaError, BotonPrincipal, BotonSecundario, panel } from "./piezas"
import { euros } from "./tipos"

function fechaLarga(iso: string) {
  const [a, m, d] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)))
}

export function PasoDocumento({
  detalle,
  cuerpo,
  onEditar,
  onNuevo,
}: {
  detalle: PresupuestoDetallado
  cuerpo: string
  onEditar: () => void
  onNuevo: () => void
}) {
  const [estado, setEstado] = React.useState<"inicial" | "generando" | "listo">(
    "inicial"
  )
  const [errores, setErrores] = React.useState<string[]>([])
  const pdf = React.useRef<{ url: string; nombre: string } | null>(null)

  React.useEffect(
    () => () => {
      if (pdf.current) URL.revokeObjectURL(pdf.current.url)
    },
    []
  )

  // El servidor vuelve a validar la selección y recalcula los importes.
  async function obtenerPdf() {
    if (pdf.current) return pdf.current
    const res = await fetch("/api/presupuesto/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: cuerpo,
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(
        (json.errores ?? ["No se ha podido generar el PDF."]).join(" ")
      )
    }
    const nombre =
      res.headers
        .get("content-disposition")
        ?.match(/filename="([^"]+)"/)?.[1] ?? "presupuesto.pdf"
    pdf.current = { url: URL.createObjectURL(await res.blob()), nombre }
    return pdf.current
  }

  async function ejecutar(accion: "descargar" | "abrir") {
    setEstado("generando")
    setErrores([])
    // Para "abrir", la pestaña se crea antes de la petición (si no, el navegador la bloquea).
    const pestana = accion === "abrir" ? window.open("", "_blank") : null
    try {
      const { url, nombre } = await obtenerPdf()
      if (pestana) {
        pestana.location.href = url
      } else {
        const a = document.createElement("a")
        a.href = url
        a.download = nombre
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
      setEstado("listo")
    } catch (e) {
      pestana?.close()
      setErrores([(e as Error).message || "No se ha podido generar el PDF."])
      setEstado("inicial")
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Vista previa con el mismo contenido y orden que el PDF */}
      <article
        aria-label="Vista previa del presupuesto"
        className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5"
      >
        <div className="h-1.5 bg-indigo-600" />
        <div className="flex flex-col gap-7 p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-indigo-600">
                Presupuesta mi web
              </p>
              <p className="text-xs text-slate-500">
                Diseño y desarrollo de páginas web
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-wider">PRESUPUESTO</p>
              <p className="text-xs text-slate-500">
                Referencia {detalle.referencia}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                Cliente
              </p>
              <p className="text-base font-bold">{detalle.cliente}</p>
            </div>
            <div className="text-right">
              <p className="text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                Fecha
              </p>
              <p className="text-sm">{fechaLarga(detalle.fecha)}</p>
            </div>
          </div>

          <Seccion titulo="Resumen del proyecto">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {detalle.resumen}
            </p>
          </Seccion>

          <Seccion titulo="Servicios incluidos">
            <ul className="flex flex-col gap-3 text-sm">
              {detalle.servicios.map((s) => (
                <li key={s.id}>
                  <p className="font-semibold">
                    {s.nombre}
                    {s.id === "landing" || s.id === "corporativa"
                      ? ` · ${detalle.paginas} ${detalle.paginas === 1 ? "página" : "páginas"}`
                      : ""}
                  </p>
                  <p className="text-slate-600">{s.descripcion}</p>
                  {s.justificacion && (
                    <p className="text-slate-500 italic">{s.justificacion}</p>
                  )}
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion titulo="Desglose de importes">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[26rem] text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[0.7rem] tracking-wide text-slate-500 uppercase">
                    <th className="rounded-l-md px-3 py-2 font-semibold">
                      Concepto
                    </th>
                    <th className="px-3 py-2 font-semibold">Detalle</th>
                    <th className="rounded-r-md px-3 py-2 text-right font-semibold">
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.lineas.map((l) => (
                    <tr key={l.concepto} className="border-b border-slate-200">
                      <td className="px-3 py-2.5">{l.concepto}</td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {l.detalle}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {euros.format(l.importe)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-600 px-4 py-3 text-white">
              <span className="text-sm font-bold">TOTAL</span>
              <span className="text-2xl font-bold tabular-nums">
                {euros.format(detalle.total)}
              </span>
            </div>
            <p className="mt-1 text-right text-xs text-slate-400">
              Importes sin impuestos.
            </p>
          </Seccion>

          {detalle.aclaraciones.length > 0 && (
            <Seccion titulo="Aclaraciones y aspectos pendientes">
              <ul className="flex flex-col gap-1.5 rounded-md border-l-4 border-amber-600 bg-amber-50 p-3 text-sm">
                {detalle.aclaraciones.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Seccion>
          )}

          <p className="border-t border-slate-200 pt-3 text-[0.7rem] text-slate-400">
            Presupuesta mi web · Presupuesto {detalle.referencia} · Los aspectos
            pendientes se valorarán aparte.
          </p>
        </div>
      </article>

      <aside
        className={cn(panel, "flex flex-col gap-4 p-6 lg:sticky lg:top-20")}
      >
        <h2 className="text-base font-semibold">Descargar</h2>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Servicios</dt>
            <dd className="font-medium">{detalle.servicios.length}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Páginas</dt>
            <dd className="font-medium">{detalle.paginas}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold tabular-nums">
              {euros.format(detalle.total)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          El PDF se genera en el servidor, que vuelve a validar la selección y a
          calcular los importes.
        </p>

        {errores.length > 0 && (
          <AlertaError
            titulo="No se ha podido generar el PDF"
            errores={errores}
          />
        )}
        {estado === "listo" && errores.length === 0 && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2Icon className="size-4" /> PDF generado.
          </p>
        )}

        <BotonPrincipal
          type="button"
          onClick={() => ejecutar("descargar")}
          disabled={estado === "generando"}
          cargando={estado === "generando"}
          className="w-full"
        >
          {estado !== "generando" && <DownloadIcon />}
          {estado === "generando"
            ? "Generando PDF…"
            : "Aceptar y descargar PDF"}
        </BotonPrincipal>
        <BotonSecundario
          type="button"
          onClick={() => ejecutar("abrir")}
          disabled={estado === "generando"}
          className="w-full"
        >
          <ExternalLinkIcon />
          Ver el PDF en otra pestaña
        </BotonSecundario>
        <div className="mt-2 flex flex-col gap-2 border-t border-slate-200/70 pt-4 dark:border-white/10">
          <BotonSecundario type="button" onClick={onEditar} className="w-full">
            <ArrowLeftIcon />
            Volver a modificar
          </BotonSecundario>
          <BotonSecundario
            type="button"
            onClick={onNuevo}
            className="w-full text-muted-foreground"
          >
            <RotateCcwIcon />
            Empezar otro presupuesto
          </BotonSecundario>
        </div>
      </aside>
    </div>
  )
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="border-b border-slate-200 pb-1.5 text-sm font-bold text-indigo-600">
        {titulo}
      </h3>
      {children}
    </section>
  )
}
