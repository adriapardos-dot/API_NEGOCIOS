"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleHelpIcon,
  InfoIcon,
  Loader2Icon,
  MinusIcon,
  PackageXIcon,
  PencilLineIcon,
  PlusIcon,
  RefreshCwIcon,
  ServerIcon,
  SparklesIcon,
  StickyNoteIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { IdServicio, ServicioCatalogo } from "@/lib/catalogo"
import { glassVariantStyles } from "@/lib/glass-variants"
import { estiloAcento } from "@/lib/estilos"
import type { PresupuestoDetallado } from "@/lib/seleccion"
import { cn } from "@/lib/utils"

import { BotonPrincipal, BotonSecundario, panel } from "./piezas"
import { euros, type Aclaracion, type ServicioElegido } from "./tipos"

const PAGINAS_MAX = 20

export function PasoRevisar(props: {
  catalogo: ServicioCatalogo[]
  avisos: string[]
  resumen: string
  onResumen: (v: string) => void
  servicios: ServicioElegido[]
  onServicios: (v: ServicioElegido[]) => void
  paginas: string
  onPaginas: (v: string) => void
  aclaraciones: Aclaracion[]
  onAclaraciones: (v: Aclaracion[]) => void
  nuevoId: () => number
  detalle: PresupuestoDetallado | null
  erroresCalculo: string[]
  calculando: boolean
  onVolver: () => void
  onConfirmar: () => void
}) {
  const { catalogo, servicios, onServicios } = props
  const info = (id: IdServicio) => catalogo.find((s) => s.id === id)
  const base = servicios.find((s) => info(s.id)?.categoria === "base")
  const disponibles = catalogo.filter(
    (s) => !servicios.some((e) => e.id === s.id)
  )

  function quitar(id: IdServicio) {
    onServicios(servicios.filter((s) => s.id !== id))
  }
  function anadir(servicio: ServicioCatalogo) {
    // Solo un tipo de web: si ya hay uno, se sustituye.
    const resto =
      servicio.categoria === "base"
        ? servicios.filter((s) => info(s.id)?.categoria !== "base")
        : servicios
    onServicios([
      ...resto,
      { id: servicio.id, justificacion: "", origen: "usuario" },
    ])
  }

  const ordenados = [...servicios].sort(
    (a, b) =>
      catalogo.findIndex((s) => s.id === a.id) -
      catalogo.findIndex((s) => s.id === b.id)
  )
  const faltaBase = !base
  const faltanPaginas = props.paginas.trim() === ""

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
      <div className="flex flex-col gap-6">
        {props.avisos.length > 0 && (
          <div className="flex gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            <ul className="flex flex-col gap-1">
              {props.avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Resumen */}
        <section className={cn(panel, "flex flex-col gap-3 p-6")}>
          <Encabezado
            icono={<PencilLineIcon />}
            titulo="Resumen del proyecto"
            descripcion="Redactado por el asistente. Puedes editarlo: aparecerá en el presupuesto."
          />
          <Textarea
            value={props.resumen}
            onChange={(e) => props.onResumen(e.target.value)}
            aria-label="Resumen del proyecto"
            maxLength={1200}
            className="min-h-24 bg-white/70 leading-relaxed dark:bg-white/5"
          />
        </section>

        {/* Servicios */}
        <section className={cn(panel, "flex flex-col gap-4 p-6")}>
          <Encabezado
            icono={<SparklesIcon />}
            titulo="Servicios propuestos"
            descripcion="Quita los que no quieras o añade otros del catálogo."
          />

          {ordenados.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-muted-foreground dark:border-white/15">
              El asistente no ha propuesto servicios. Añade al menos un tipo de
              web del catálogo.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {ordenados.map((s) => {
                const servicio = info(s.id)
                if (!servicio) return null
                return (
                  <li
                    key={s.id}
                    className="group/servicio flex flex-col gap-3 rounded-xl border border-indigo-200/70 bg-white/70 p-4 dark:border-indigo-300/15 dark:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{servicio.nombre}</span>
                          <Etiqueta tipo={servicio.categoria} />
                          {s.origen === "usuario" && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              Añadido por ti
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {servicio.descripcion}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitar(s.id)}
                        aria-label={`Quitar ${servicio.nombre}`}
                        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive dark:hover:bg-red-400/10"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                    {s.justificacion && (
                      <p className="flex gap-2 rounded-lg bg-indigo-50/80 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-400/10 dark:text-indigo-100">
                        <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-indigo-500 dark:text-indigo-300" />
                        <span>{s.justificacion}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {servicio.regla}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}

          {disponibles.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-200/70 pt-4 dark:border-white/10">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Añadir del catálogo
              </span>
              <ul className="grid gap-2 sm:grid-cols-2">
                {disponibles.map((servicio) => {
                  const sustituye = servicio.categoria === "base" && base
                  return (
                    <li key={servicio.id}>
                      <button
                        type="button"
                        onClick={() => anadir(servicio)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/70 bg-white/45 px-3 py-2.5 text-left transition-colors hover:border-indigo-300 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-300/40 dark:hover:bg-white/[0.07]"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
                          {sustituye ? (
                            <RefreshCwIcon className="size-3.5" />
                          ) : (
                            <PlusIcon className="size-4" />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm font-medium">
                            {sustituye
                              ? `Cambiar a ${servicio.nombre.toLowerCase()}`
                              : servicio.nombre}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {euros.format(servicio.precio)}
                            {servicio.categoria === "base"
                              ? " · incluye 1 página"
                              : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Aclaraciones */}
        <SeccionAclaraciones
          aclaraciones={props.aclaraciones}
          onAclaraciones={props.onAclaraciones}
          nuevoId={props.nuevoId}
        />
      </div>

      {/* Columna derecha: datos necesarios y cálculo del servidor */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <section className={cn(panel, "flex flex-col gap-4 p-6")}>
          <Encabezado
            icono={<InfoIcon />}
            titulo="Datos para el cálculo"
            descripcion="Necesarios para calcular las partidas."
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Tipo de web</span>
            {base ? (
              <span className="text-sm text-muted-foreground">
                {info(base.id)?.nombre}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
                <TriangleAlertIcon className="size-4" />
                Añade una landing o una web corporativa.
              </span>
            )}
          </div>
          <SelectorPaginas
            valor={props.paginas}
            onCambio={props.onPaginas}
            falta={faltanPaginas}
          />
        </section>

        <section
          className={cn(panel, "flex flex-col gap-4 p-6")}
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Presupuesto</h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {props.calculando ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <ServerIcon className="size-3.5" />
              )}
              {props.calculando ? "Calculando…" : "Calculado por el servidor"}
            </span>
          </div>

          {props.detalle ? (
            <div
              className={cn(
                "flex flex-col gap-3 transition-opacity",
                props.calculando && "opacity-50"
              )}
            >
              <dl className="flex flex-col gap-2.5 text-sm">
                {props.detalle.lineas.map((l) => (
                  <div
                    key={l.concepto}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <dt className="flex flex-col">
                      <span>{l.concepto}</span>
                      <span className="text-xs text-muted-foreground">
                        {l.detalle}
                      </span>
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {euros.format(l.importe)}
                    </dd>
                  </div>
                ))}
              </dl>
              <div
                className={cn(
                  glassVariantStyles.liquid,
                  estiloAcento,
                  "mt-1 flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
                )}
              >
                <span className="text-sm font-semibold">Total</span>
                <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
                  {euros.format(props.detalle.total)}
                </span>
              </div>
              <p className="text-right text-xs text-muted-foreground">
                Sin impuestos.
              </p>
            </div>
          ) : props.erroresCalculo.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
              <span className="font-medium">
                Para calcular el presupuesto falta:
              </span>
              <ul className="list-inside list-disc">
                {props.erroresCalculo.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Calculando…
            </p>
          )}

          <BotonPrincipal
            type="button"
            onClick={props.onConfirmar}
            disabled={
              !props.detalle || props.calculando || faltaBase || faltanPaginas
            }
            className="w-full"
          >
            Revisar documento
            <ArrowRightIcon />
          </BotonPrincipal>
          <BotonSecundario
            type="button"
            onClick={props.onVolver}
            className="w-full"
          >
            <ArrowLeftIcon />
            Modificar la descripción
          </BotonSecundario>
        </section>
      </aside>
    </div>
  )
}

function Encabezado({
  icono,
  titulo,
  descripcion,
}: {
  icono: React.ReactNode
  titulo: string
  descripcion: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300 [&_svg]:size-4">
        {icono}
      </span>
      <div className="flex flex-col">
        <h2 className="text-base font-semibold">{titulo}</h2>
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </div>
    </div>
  )
}

function Etiqueta({ tipo }: { tipo: "base" | "extra" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
        tipo === "base"
          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200"
          : "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200"
      )}
    >
      {tipo === "base" ? "Tipo de web" : "Extra"}
    </span>
  )
}

function SelectorPaginas({
  valor,
  onCambio,
  falta,
}: {
  valor: string
  onCambio: (v: string) => void
  falta: boolean
}) {
  const actual = Number.parseInt(valor, 10)
  function sumar(delta: number) {
    const base = Number.isFinite(actual) ? actual : 0
    onCambio(String(Math.min(PAGINAS_MAX, Math.max(1, base + delta))))
  }
  const boton =
    "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-white/70 bg-white/60 text-indigo-600 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10"
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="paginas" className="text-sm font-medium">
        Número total de páginas
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={boton}
          onClick={() => sumar(-1)}
          aria-label="Quitar una página"
        >
          <MinusIcon className="size-4" />
        </button>
        <Input
          id="paginas"
          type="number"
          inputMode="numeric"
          min={1}
          max={PAGINAS_MAX}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder="—"
          aria-invalid={falta || undefined}
          aria-describedby="paginas-ayuda"
          className="h-9 w-20 [appearance:textfield] bg-white/70 text-center font-semibold tabular-nums dark:bg-white/5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={boton}
          onClick={() => sumar(1)}
          aria-label="Añadir una página"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      <p
        id="paginas-ayuda"
        className={cn(
          "text-xs",
          falta
            ? "font-medium text-amber-700 dark:text-amber-300"
            : "text-muted-foreground"
        )}
      >
        {falta
          ? "Dato necesario: el asistente no ha podido deducirlo. Indica cuántas páginas tendrá la web."
          : `Incluida la página de inicio · entre 1 y ${PAGINAS_MAX}.`}
      </p>
    </div>
  )
}

function SeccionAclaraciones({
  aclaraciones,
  onAclaraciones,
  nuevoId,
}: {
  aclaraciones: Aclaracion[]
  onAclaraciones: (v: Aclaracion[]) => void
  nuevoId: () => number
}) {
  const [nueva, setNueva] = React.useState("")

  function anadir(e: React.FormEvent) {
    e.preventDefault()
    const texto = nueva.trim()
    if (!texto) return
    onAclaraciones([...aclaraciones, { id: nuevoId(), texto, tipo: "nota" }])
    setNueva("")
  }

  const icono = {
    duda: (
      <CircleHelpIcon className="size-4 text-amber-600 dark:text-amber-300" />
    ),
    pendiente: (
      <PackageXIcon className="size-4 text-rose-600 dark:text-rose-300" />
    ),
    nota: (
      <StickyNoteIcon className="size-4 text-slate-500 dark:text-slate-300" />
    ),
  }

  return (
    <section className={cn(panel, "flex flex-col gap-4 p-6")}>
      <Encabezado
        icono={<CircleHelpIcon />}
        titulo="Aclaraciones y aspectos pendientes"
        descripcion="Dudas del asistente y necesidades fuera del catálogo. Se incluyen en el PDF; puedes editarlas o quitarlas."
      />
      {aclaraciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay aspectos pendientes de concretar.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {aclaraciones.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-2.5 rounded-xl border border-white/70 bg-white/55 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="mt-2 shrink-0">{icono[a.tipo]}</span>
              <Textarea
                value={a.texto}
                onChange={(e) =>
                  onAclaraciones(
                    aclaraciones.map((x) =>
                      x.id === a.id ? { ...x, texto: e.target.value } : x
                    )
                  )
                }
                maxLength={400}
                aria-label="Aclaración"
                className="min-h-0 flex-1 resize-none border-transparent bg-transparent px-1 py-1.5 shadow-none focus-visible:border-input dark:bg-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  onAclaraciones(aclaraciones.filter((x) => x.id !== a.id))
                }
                aria-label="Quitar aclaración"
                className="mt-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive dark:hover:bg-red-400/10"
              >
                <XIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={anadir} className="flex gap-2">
        <Input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Añadir una nota o respuesta (p. ej.: idiomas: castellano e inglés)"
          maxLength={400}
          aria-label="Nueva aclaración"
          className="h-9 bg-white/70 dark:bg-white/5"
        />
        <BotonSecundario
          type="submit"
          disabled={!nueva.trim()}
          className="h-9 px-4"
        >
          <PlusIcon />
          Añadir
        </BotonSecundario>
      </form>
    </section>
  )
}
