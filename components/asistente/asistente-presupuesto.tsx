"use client"

import * as React from "react"
import {
  CheckIcon,
  FileTextIcon,
  ListChecksIcon,
  MessageSquareTextIcon,
  SparklesIcon,
} from "lucide-react"

import { EVENTO_BORRADOR, recogerBorrador } from "@/components/chat/borrador"
import { cn } from "@/lib/utils"
import type { ServicioCatalogo } from "@/lib/catalogo"
import type { PresupuestoDetallado } from "@/lib/seleccion"

import { PasoDescribir } from "./paso-describir"
import { PasoDocumento } from "./paso-documento"
import { PasoRevisar } from "./paso-revisar"
import type { Aclaracion, Propuesta, ServicioElegido } from "./tipos"

type Paso = "describir" | "revisar" | "documento"

const PASOS: { id: Paso; titulo: string; icono: React.ElementType }[] = [
  {
    id: "describir",
    titulo: "Describe tu proyecto",
    icono: MessageSquareTextIcon,
  },
  { id: "revisar", titulo: "Revisa la propuesta", icono: ListChecksIcon },
  { id: "documento", titulo: "Descarga el presupuesto", icono: FileTextIcon },
]

let siguienteId = 1
const nuevoId = () => siguienteId++

export function AsistentePresupuesto() {
  const [paso, setPaso] = React.useState<Paso>("describir")
  const [catalogo, setCatalogo] = React.useState<ServicioCatalogo[]>([])

  // Paso 1
  const [cliente, setCliente] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [analizando, setAnalizando] = React.useState(false)
  const [errorIA, setErrorIA] = React.useState<{
    errores: string[]
    reintentable: boolean
  } | null>(null)

  // Paso 2 (lo que el usuario revisa y puede cambiar)
  const [propuesta, setPropuesta] = React.useState<Propuesta | null>(null)
  const [resumen, setResumen] = React.useState("")
  const [servicios, setServicios] = React.useState<ServicioElegido[]>([])
  const [paginas, setPaginas] = React.useState("")
  const [aclaraciones, setAclaraciones] = React.useState<Aclaracion[]>([])

  // Cálculo del servidor
  const [detalle, setDetalle] = React.useState<PresupuestoDetallado | null>(
    null
  )
  const [erroresCalculo, setErroresCalculo] = React.useState<string[]>([])
  // Cuerpo que produjo el último resultado: si no coincide con el actual, se está recalculando.
  const [cuerpoCalculado, setCuerpoCalculado] = React.useState("")

  // Paso 3: la selección confirmada que se envía para el PDF.
  const [confirmado, setConfirmado] = React.useState<{
    cuerpo: string
    detalle: PresupuestoDetallado
  } | null>(null)

  React.useEffect(() => {
    fetch("/api/catalogo")
      .then((r) => r.json())
      .then((j) => setCatalogo(j.servicios ?? []))
      .catch(() => setCatalogo([]))
  }, [])

  // Descripción redactada en el chat de ayuda («Usar en el asistente»).
  React.useEffect(() => {
    function aplicar() {
      const texto = recogerBorrador()
      if (!texto) return
      setDescripcion(texto)
      setErrorIA(null)
      setPaso("describir")
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => document.getElementById("cliente")?.focus(), 300)
    }
    // Si se pulsó desde otra página, el borrador espera en sessionStorage.
    const t = setTimeout(aplicar, 0)
    window.addEventListener(EVENTO_BORRADOR, aplicar)
    return () => {
      clearTimeout(t)
      window.removeEventListener(EVENTO_BORRADOR, aplicar)
    }
  }, [])

  // ---- Paso 1: pedir la propuesta a la IA (en el servidor) -----------------
  async function analizar() {
    setAnalizando(true)
    setErrorIA(null)
    try {
      const res = await fetch("/api/propuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente, descripcion }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorIA({
          errores: json.errores ?? ["No se ha podido preparar la propuesta."],
          reintentable: Boolean(json.reintentable) || res.status >= 500,
        })
        return
      }
      cargarPropuesta(json as Propuesta)
      setPaso("revisar")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setErrorIA({
        errores: [
          "No se ha podido conectar con el servidor. Comprueba tu conexión.",
        ],
        reintentable: true,
      })
    } finally {
      setAnalizando(false)
    }
  }

  function cargarPropuesta(p: Propuesta) {
    setPropuesta(p)
    setResumen(p.resumen)
    setServicios(p.servicios.map((s) => ({ ...s, origen: "ia" as const })))
    setPaginas(p.paginas === null ? "" : String(p.paginas))
    setAclaraciones([
      ...p.dudas.map((texto) => ({
        id: nuevoId(),
        texto,
        tipo: "duda" as const,
      })),
      ...p.fueraDeCatalogo.map((f) => ({
        id: nuevoId(),
        texto: `Pendiente de valorar (fuera del catálogo): ${f.necesidad}${f.motivo ? `. ${f.motivo}` : ""}`,
        tipo: "pendiente" as const,
      })),
    ])
    setDetalle(null)
    setConfirmado(null)
  }

  // ---- Paso 2: el servidor recalcula cada vez que cambia la selección ------
  const cuerpoSeleccion = React.useMemo(
    () =>
      JSON.stringify({
        cliente,
        resumen,
        servicios: servicios.map(({ id, justificacion }) => ({
          id,
          justificacion,
        })),
        paginas: paginas.trim() === "" ? null : Number(paginas),
        aclaraciones: aclaraciones.map((a) => a.texto),
      }),
    [cliente, resumen, servicios, paginas, aclaraciones]
  )

  React.useEffect(() => {
    if (paso !== "revisar") return
    const control = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/presupuesto/detalle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cuerpoSeleccion,
          signal: control.signal,
        })
        const json = await res.json()
        if (res.ok) {
          setDetalle(json)
          setErroresCalculo([])
        } else {
          setDetalle(null)
          setErroresCalculo(json.errores ?? ["No se ha podido calcular."])
        }
        setCuerpoCalculado(cuerpoSeleccion)
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        setDetalle(null)
        setErroresCalculo([
          "No se ha podido conectar con el servidor para calcular.",
        ])
        setCuerpoCalculado(cuerpoSeleccion)
      }
    }, 300)
    return () => {
      clearTimeout(t)
      control.abort()
    }
  }, [cuerpoSeleccion, paso])

  const calculando = cuerpoCalculado !== cuerpoSeleccion

  function confirmar() {
    if (!detalle || calculando) return
    setConfirmado({ cuerpo: cuerpoSeleccion, detalle })
    setPaso("documento")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function reiniciar() {
    setPaso("describir")
    setPropuesta(null)
    setConfirmado(null)
    setDetalle(null)
    setDescripcion("")
    setCliente("")
    setErrorIA(null)
  }

  const indicePaso = PASOS.findIndex((p) => p.id === paso)
  const pasoDisponible = (p: Paso) =>
    p === "describir" ||
    (p === "revisar" && propuesta !== null) ||
    (p === "documento" && confirmado !== null)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-300/60 bg-white/50 px-3 py-1 text-xs font-medium text-indigo-700 backdrop-blur dark:border-indigo-400/30 dark:bg-white/5 dark:text-indigo-200">
          <SparklesIcon className="size-3.5" />
          Asistente de presupuestos con IA
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {paso === "describir" && "Cuéntanos qué web necesitas"}
          {paso === "revisar" && "Revisa la propuesta"}
          {paso === "documento" && "Tu presupuesto está listo"}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {paso === "describir" &&
            "Describe tu proyecto con tus palabras. El asistente lo relaciona con nuestro catálogo y te propone los servicios; tú decides qué incluir."}
          {paso === "revisar" &&
            "Acepta, quita o añade servicios del catálogo y completa los datos que falten. Los importes los calcula nuestro servidor con las tarifas vigentes."}
          {paso === "documento" &&
            "Comprueba el contenido del documento antes de descargarlo. El PDF refleja exactamente esta selección y estos importes."}
        </p>
      </header>

      <nav aria-label="Progreso">
        <ol className="grid grid-cols-3 gap-2 sm:gap-3">
          {PASOS.map((p, i) => {
            const Icono = p.icono
            const hecho = i < indicePaso
            const actual = i === indicePaso
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={!pasoDisponible(p.id) || actual || analizando}
                  onClick={() => setPaso(p.id)}
                  aria-current={actual ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    actual
                      ? "border-indigo-400/60 bg-white/70 shadow-sm dark:border-indigo-300/40 dark:bg-white/10"
                      : "border-white/50 bg-white/25 dark:border-white/10 dark:bg-white/[0.03]",
                    !actual &&
                      pasoDisponible(p.id) &&
                      "cursor-pointer hover:bg-white/50 dark:hover:bg-white/[0.07]",
                    !pasoDisponible(p.id) && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      actual && "bg-indigo-500 text-white",
                      hecho && "bg-emerald-500 text-white",
                      !actual &&
                        !hecho &&
                        "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                    )}
                  >
                    {hecho ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <Icono className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
                      Paso {i + 1}
                    </span>
                    <span className="hidden truncate text-sm font-medium sm:block">
                      {p.titulo}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {paso === "describir" && (
        <PasoDescribir
          cliente={cliente}
          descripcion={descripcion}
          onCliente={setCliente}
          onDescripcion={setDescripcion}
          onEnviar={analizar}
          analizando={analizando}
          error={errorIA}
          hayPropuesta={propuesta !== null}
          onVolverAPropuesta={() => setPaso("revisar")}
        />
      )}

      {paso === "revisar" && propuesta && (
        <PasoRevisar
          catalogo={catalogo}
          avisos={propuesta.avisos}
          resumen={resumen}
          onResumen={setResumen}
          servicios={servicios}
          onServicios={setServicios}
          paginas={paginas}
          onPaginas={setPaginas}
          aclaraciones={aclaraciones}
          onAclaraciones={setAclaraciones}
          nuevoId={nuevoId}
          detalle={detalle}
          erroresCalculo={erroresCalculo}
          calculando={calculando}
          onVolver={() => setPaso("describir")}
          onConfirmar={confirmar}
        />
      )}

      {paso === "documento" && confirmado && (
        <PasoDocumento
          detalle={confirmado.detalle}
          cuerpo={confirmado.cuerpo}
          onEditar={() => setPaso("revisar")}
          onNuevo={reiniciar}
        />
      )}
    </div>
  )
}
