"use client"

import * as React from "react"
import {
  AlertCircleIcon,
  CalculatorIcon,
  FileTextIcon,
  GlobeIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  MailIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react"

import { AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { RadioGroup } from "@/components/ui/radio-group"
import { GlassAlert } from "@/components/ui/glasscn/glass-alert"
import { GlassBadge } from "@/components/ui/glasscn/glass-badge"
import { GlassButton } from "@/components/ui/glasscn/glass-button"
import { GlassCard } from "@/components/ui/glasscn/glass-card"
import { GlassCheckbox } from "@/components/ui/glasscn/glass-checkbox"
import { GlassInput } from "@/components/ui/glasscn/glass-input"
import { GlassRadioGroupItem } from "@/components/ui/glasscn/glass-radio-group"
import { GlassSeparator } from "@/components/ui/glasscn/glass-separator"
import { GlassSlider } from "@/components/ui/glasscn/glass-slider"
import { glassVariantStyles } from "@/lib/glass-variants"
import { cn } from "@/lib/utils"
import type { Presupuesto, TARIFAS, TipoWeb } from "@/lib/presupuesto"

type Tarifas = typeof TARIFAS

const euros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
})

export function CalculadoraPresupuesto() {
  const [tarifas, setTarifas] = React.useState<Tarifas | null>(null)
  const [servicioActivo, setServicioActivo] = React.useState<boolean | null>(
    null
  )

  const [tipo, setTipo] = React.useState<TipoWeb>("landing")
  const [paginas, setPaginas] = React.useState("1")
  const [formulario, setFormulario] = React.useState(false)
  const [segundoIdioma, setSegundoIdioma] = React.useState(false)

  const [presupuesto, setPresupuesto] = React.useState<Presupuesto | null>(null)
  const [errores, setErrores] = React.useState<string[]>([])
  const [cargando, setCargando] = React.useState(false)
  const [desactualizado, setDesactualizado] = React.useState(false)
  const [tipoCalculado, setTipoCalculado] = React.useState<TipoWeb>("landing")

  // Las tarifas y el estado se leen de la API: la interfaz no guarda precios.
  React.useEffect(() => {
    fetch("/api/tarifas")
      .then((res) => res.json())
      .then((json) => setTarifas(json.tarifas))
      .catch(() => setTarifas(null))
    fetch("/api/estado")
      .then((res) => res.json())
      .then((json) => setServicioActivo(json.status === "ok"))
      .catch(() => setServicioActivo(false))
  }, [])

  function cambiar<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor)
      if (presupuesto) setDesactualizado(true)
    }
  }

  function sumarPaginas(delta: number) {
    const actual = Number.parseInt(paginas, 10) || 1
    cambiar(setPaginas)(String(Math.min(20, Math.max(1, actual + delta))))
  }

  // La barra solo representa valores válidos; el campo puede tener cualquiera.
  const paginasEnBarra = Math.min(
    20,
    Math.max(1, Number.parseInt(paginas, 10) || 1)
  )

  async function calcular(evento: React.FormEvent) {
    evento.preventDefault()
    setCargando(true)
    setErrores([])
    try {
      const res = await fetch("/api/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // paginas se envía tal cual; la validación la hace el servidor (noValidate).
        body: JSON.stringify({
          tipo,
          paginas: paginas.trim() === "" ? null : Number(paginas),
          formulario,
          segundoIdioma,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setPresupuesto(json)
        setTipoCalculado(tipo)
        setDesactualizado(false)
      } else {
        setPresupuesto(null)
        setErrores(json.errores ?? ["No se ha podido calcular el presupuesto."])
      }
    } catch {
      setPresupuesto(null)
      setErrores(["No se ha podido conectar con el servidor."])
    } finally {
      setCargando(false)
    }
  }

  const precio = (valor: number | undefined) =>
    valor === undefined ? "—" : euros.format(valor)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col items-start gap-4">
        <GlassBadge glassVariant="clear" className="gap-1.5 rounded-full">
          <span
            className={
              servicioActivo === null
                ? "size-1.5 rounded-full bg-muted-foreground"
                : servicioActivo
                  ? "size-1.5 rounded-full bg-emerald-500"
                  : "size-1.5 rounded-full bg-destructive"
            }
          />
          {servicioActivo === null
            ? "Comprobando servicio…"
            : servicioActivo
              ? "Servicio activo"
              : "Servicio no disponible"}
        </GlassBadge>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Calcula el presupuesto de tu web
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Elige el tipo de web, cuántas páginas necesitas y los extras. El
            precio lo calcula nuestro servidor con sus tarifas.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
        <GlassCard
          glassVariant="clear"
          className="gap-6 rounded-2xl bg-white/10 py-8 dark:bg-white/[0.03]"
        >
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="text-xl">Características</CardTitle>
            <CardDescription>
              Todos los campos son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8">
            <form
              onSubmit={calcular}
              noValidate
              className="flex flex-col gap-7"
            >
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">
                  Tipo de web
                </legend>
                <RadioGroup
                  value={tipo}
                  onValueChange={(valor) => cambiar(setTipo)(valor as TipoWeb)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <OpcionTipo
                    valor="landing"
                    titulo="Landing"
                    descripcion="Una página de presentación"
                    precio={precio(tarifas?.landing)}
                    icono={<FileTextIcon />}
                  />
                  <OpcionTipo
                    valor="corporativa"
                    titulo="Web corporativa"
                    descripcion="Web completa de empresa"
                    precio={precio(tarifas?.corporativa)}
                    icono={<LayoutTemplateIcon />}
                  />
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  El precio base incluye la primera página.
                </p>
              </fieldset>

              <div className="flex flex-col gap-3">
                <label htmlFor="paginas" className="text-sm font-medium">
                  Número de páginas
                </label>
                <div className="flex items-center gap-2">
                  <GlassButton
                    type="button"
                    glassVariant="liquid"
                    size="icon-lg"
                    className="rounded-full text-indigo-600 transition-[scale,background-color] duration-200 hover:scale-110 hover:bg-indigo-300/30 active:scale-95 motion-reduce:transition-none dark:text-indigo-300 dark:hover:bg-indigo-400/15"
                    aria-label="Quitar una página"
                    onClick={() => sumarPaginas(-1)}
                  >
                    <MinusIcon className="transition-transform duration-300 group-hover/button:scale-x-125" />
                  </GlassButton>
                  <GlassSlider
                    min={1}
                    max={20}
                    step={1}
                    value={paginasEnBarra}
                    onValueChange={(valor) =>
                      cambiar(setPaginas)(String(valor))
                    }
                    thumbLabel="Número de páginas"
                    className="flex-1 px-1"
                  />
                  <GlassButton
                    type="button"
                    glassVariant="liquid"
                    size="icon-lg"
                    className="rounded-full text-indigo-600 transition-[scale,background-color] duration-200 hover:scale-110 hover:bg-indigo-300/30 active:scale-95 motion-reduce:transition-none dark:text-indigo-300 dark:hover:bg-indigo-400/15"
                    aria-label="Añadir una página"
                    onClick={() => sumarPaginas(1)}
                  >
                    <PlusIcon className="transition-transform duration-300 group-hover/button:rotate-90" />
                  </GlassButton>
                  <GlassInput
                    id="paginas"
                    glassVariant="clear"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    step={1}
                    value={paginas}
                    onChange={(e) => cambiar(setPaginas)(e.target.value)}
                    className="h-9 w-16 [appearance:textfield] rounded-full text-center font-semibold tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Entre 1 y 20 · {precio(tarifas?.paginaAdicional)} cada página
                  adicional
                </span>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">Extras</legend>
                <OpcionExtra
                  id="formulario"
                  titulo="Formulario de contacto"
                  precio={precio(tarifas?.formulario)}
                  icono={<MailIcon />}
                  marcado={formulario}
                  onCambio={cambiar(setFormulario)}
                />
                <OpcionExtra
                  id="segundoIdioma"
                  titulo="Segundo idioma"
                  precio={precio(tarifas?.segundoIdioma)}
                  icono={<GlobeIcon />}
                  marcado={segundoIdioma}
                  onCambio={cambiar(setSegundoIdioma)}
                />
              </fieldset>

              <GlassButton
                type="submit"
                glassVariant="liquid"
                size="lg"
                disabled={cargando}
                className={cn(
                  estiloAcento,
                  "brillo-hover h-11 w-full rounded-full text-sm font-semibold transition-[translate,scale,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgba(99,102,241,0.65)] active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none"
                )}
              >
                {cargando ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <CalculatorIcon />
                )}
                {cargando ? "Calculando…" : "Calcular presupuesto"}
              </GlassButton>
            </form>
          </CardContent>
        </GlassCard>

        <div className="flex flex-col gap-4 lg:sticky lg:top-8">
          <GlassCard
            glassVariant="clear"
            className="gap-6 rounded-2xl bg-white/10 py-8 dark:bg-white/[0.03]"
          >
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="text-xl">Presupuesto</CardTitle>
              <CardDescription>
                {presupuesto
                  ? desactualizado
                    ? "Has cambiado los datos: vuelve a calcular."
                    : "Desglose calculado por el servidor."
                  : "Rellena el formulario y pulsa calcular."}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={
                desactualizado
                  ? "px-6 opacity-50 transition-opacity sm:px-8"
                  : "px-6 transition-opacity sm:px-8"
              }
            >
              <dl className="flex flex-col gap-4 text-base">
                <Linea
                  concepto={
                    presupuesto
                      ? `Base · ${tipoCalculado === "landing" ? "Landing" : "Web corporativa"}`
                      : "Base"
                  }
                  importe={presupuesto?.base}
                />
                <Linea
                  concepto="Páginas adicionales"
                  importe={presupuesto?.paginasAdicionales}
                />
                <Linea
                  concepto="Formulario de contacto"
                  importe={presupuesto?.formulario}
                />
                <Linea
                  concepto="Segundo idioma"
                  importe={presupuesto?.segundoIdioma}
                />
              </dl>
              <GlassSeparator glassVariant="liquid" className="my-5" />
              <div
                className={cn(
                  glassVariantStyles.liquid,
                  estiloAcento,
                  "flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
                )}
              >
                <span className="text-sm font-semibold">Total</span>
                <span
                  className={cn(
                    "font-heading text-4xl font-semibold tracking-tight tabular-nums",
                    !presupuesto && "opacity-40"
                  )}
                >
                  {presupuesto ? euros.format(presupuesto.total) : "—"}
                </span>
              </div>
              <p className="mt-2 text-right text-xs text-muted-foreground">
                Sin impuestos ni descuentos.
              </p>
            </CardContent>
          </GlassCard>

          {errores.length > 0 && (
            <GlassAlert
              glassVariant="clear"
              className="rounded-2xl px-4 py-3 text-destructive"
            >
              <AlertCircleIcon />
              <AlertTitle>Revisa los datos</AlertTitle>
              <AlertDescription className="text-destructive/90">
                <ul className="list-inside list-disc">
                  {errores.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </GlassAlert>
          )}
        </div>
      </div>
    </div>
  )
}

// Tarjeta de opción: cristal claro que se tiñe de índigo al marcarse.
const estiloOpcion =
  "flex cursor-pointer gap-3 rounded-xl border border-white/50 bg-white/10 transition-colors hover:bg-white/25 has-data-checked:border-indigo-400/70 has-data-checked:bg-indigo-400/10 has-data-checked:ring-3 has-data-checked:ring-indigo-400/15 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] dark:has-data-checked:border-indigo-300/40 dark:has-data-checked:bg-indigo-400/15 [&_svg]:size-4"

// Radio y casilla: borde visible sin marcar, índigo al marcar.
// Cristal de acento del botón principal y del total: reflejo suave encima de
// un degradado violeta → índigo → cielo (los tonos del fondo) que fluye despacio.
const estiloAcento =
  "bg-indigo-500 text-white [background-image:linear-gradient(180deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.05)_55%,rgba(255,255,255,0)_100%),linear-gradient(110deg,#8b5cf6,#6366f1,#0ea5e9,#8b5cf6)] [background-size:100%_100%,300%_100%] animate-[degradado-fluir_8s_ease-in-out_infinite] motion-reduce:animate-none dark:bg-indigo-600 dark:[background-image:linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%),linear-gradient(110deg,#7c3aed,#4f46e5,#0284c7,#7c3aed)]"

const estiloMarcador =
  "border-slate-300 bg-white/70 data-checked:border-indigo-500 data-checked:bg-indigo-500 data-checked:text-white dark:border-white/25 dark:bg-white/10 dark:data-checked:border-indigo-400 dark:data-checked:bg-indigo-400 dark:data-checked:text-slate-950"

function OpcionTipo({
  valor,
  titulo,
  descripcion,
  precio,
  icono,
}: {
  valor: TipoWeb
  titulo: string
  descripcion: string
  precio: string
  icono: React.ReactNode
}) {
  return (
    <label className={cn(estiloOpcion, "items-start p-4")}>
      <GlassRadioGroupItem
        value={valor}
        glassVariant="clear"
        className={cn("mt-0.5", estiloMarcador)}
      />
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-indigo-500 dark:text-indigo-300">{icono}</span>
          {titulo}
        </span>
        <span className="text-xs text-muted-foreground">{descripcion}</span>
        <span className="mt-1 text-sm font-semibold tabular-nums">
          {precio}
        </span>
      </span>
    </label>
  )
}

function OpcionExtra({
  id,
  titulo,
  precio,
  icono,
  marcado,
  onCambio,
}: {
  id: string
  titulo: string
  precio: string
  icono: React.ReactNode
  marcado: boolean
  onCambio: (valor: boolean) => void
}) {
  return (
    <label htmlFor={id} className={cn(estiloOpcion, "items-center px-4 py-3")}>
      <GlassCheckbox
        id={id}
        glassVariant="clear"
        checked={marcado}
        onCheckedChange={(valor) => onCambio(valor)}
        className={estiloMarcador}
      />
      <span className="text-indigo-500 dark:text-indigo-300">{icono}</span>
      <span className="flex-1 text-sm font-medium">{titulo}</span>
      <span className="text-sm font-semibold tabular-nums">+{precio}</span>
    </label>
  )
}

function Linea({ concepto, importe }: { concepto: string; importe?: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{concepto}</dt>
      <dd className="font-medium tabular-nums">
        {importe === undefined ? "—" : euros.format(importe)}
      </dd>
    </div>
  )
}
