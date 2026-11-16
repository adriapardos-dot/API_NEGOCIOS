"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowUpIcon,
  FileInputIcon,
  MessageCircleIcon,
  RotateCcwIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"

import { estiloAcento } from "@/lib/estilos"
import { cn } from "@/lib/utils"

import { guardarBorrador } from "./borrador"

type Mensaje = {
  id: number
  rol: "usuario" | "asistente"
  texto: string
  borrador?: string | null
}

const SUGERENCIAS = [
  "¿Qué servicios ofrecéis?",
  "¿Cuánto cuesta una web corporativa?",
  "¿Hacéis tiendas online?",
  "Ayúdame a describir mi proyecto",
]

const MAX_MENSAJE = 1000
const MAX_HISTORIAL = 20

let siguienteId = 1

export function ChatAyuda() {
  const [abierto, setAbierto] = React.useState(false)
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([])
  const [texto, setTexto] = React.useState("")
  const [pensando, setPensando] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const lista = React.useRef<HTMLDivElement>(null)
  const entrada = React.useRef<HTMLTextAreaElement>(null)
  const ruta = usePathname()
  const router = useRouter()

  // Desplazar al último mensaje.
  React.useEffect(() => {
    lista.current?.scrollTo({
      top: lista.current.scrollHeight,
      behavior: "smooth",
    })
  }, [mensajes, pensando, error])

  React.useEffect(() => {
    if (abierto) entrada.current?.focus()
  }, [abierto])

  async function enviar(historial: Mensaje[]) {
    setPensando(true)
    setError(null)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: historial
            .slice(-MAX_HISTORIAL)
            .map(({ rol, texto }) => ({ rol, texto })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          json.errores?.join(" ") ?? "No se ha podido obtener respuesta."
        )
        return
      }
      setMensajes([
        ...historial,
        {
          id: siguienteId++,
          rol: "asistente",
          texto: json.respuesta,
          borrador: json.borradorDescripcion,
        },
      ])
    } catch {
      setError(
        "No se ha podido conectar con el servidor. Comprueba tu conexión."
      )
    } finally {
      setPensando(false)
    }
  }

  function preguntar(pregunta: string) {
    const limpio = pregunta.trim()
    if (!limpio || pensando || limpio.length > MAX_MENSAJE) return
    const historial = [
      ...mensajes,
      { id: siguienteId++, rol: "usuario" as const, texto: limpio },
    ]
    setMensajes(historial)
    setTexto("")
    enviar(historial)
  }

  function usarBorrador(borrador: string) {
    guardarBorrador(borrador)
    setAbierto(false)
    if (ruta !== "/") router.push("/")
  }

  function nuevaConversacion() {
    setMensajes([])
    setError(null)
    setTexto("")
    entrada.current?.focus()
  }

  const excedido = texto.trim().length > MAX_MENSAJE

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls="chat-ayuda"
        aria-label={
          abierto ? "Cerrar el chat de ayuda" : "Abrir el chat de ayuda"
        }
        className={cn(
          estiloAcento,
          "fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 flex h-12 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-[0_14px_30px_-10px_rgba(79,70,229,0.7)] transition-[translate,scale] duration-200 hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none sm:right-6 sm:bottom-6",
          abierto && "max-sm:hidden"
        )}
      >
        {abierto ? (
          <XIcon className="size-5" />
        ) : (
          <MessageCircleIcon className="size-5" />
        )}
        <span className="hidden sm:inline">
          {abierto ? "Cerrar" : "¿Dudas? Pregúntanos"}
        </span>
      </button>

      {/* Panel */}
      <section
        id="chat-ayuda"
        role="dialog"
        aria-label="Chat de ayuda"
        hidden={!abierto}
        onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
        className="fixed inset-x-2 top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-22 sm:h-[min(36rem,calc(100dvh-8rem))] sm:w-[24rem] dark:border-white/10 dark:bg-slate-900/90"
      >
        <header className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-white/10">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-violet-500 via-indigo-500 to-sky-500 text-white">
            <SparklesIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold">Asistente de ayuda</span>
            <span className="truncate text-xs text-muted-foreground">
              Servicios, tarifas y cómo pedir tu presupuesto
            </span>
          </div>
          {mensajes.length > 0 && (
            <button
              type="button"
              onClick={nuevaConversacion}
              aria-label="Nueva conversación"
              title="Nueva conversación"
              className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
            >
              <RotateCcwIcon className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar el chat"
            className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
          >
            <XIcon className="size-4" />
          </button>
        </header>

        <div
          ref={lista}
          aria-live="polite"
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          <Burbuja rol="asistente">
            ¡Hola! Soy el asistente de Presupuesta mi web. Puedo explicarte
            nuestros servicios y tarifas, cómo funciona la aplicación o ayudarte
            a describir tu proyecto para pedir un presupuesto.
          </Burbuja>

          {mensajes.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => preguntar(s)}
                  className="cursor-pointer rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-400/30 dark:bg-white/5 dark:text-indigo-200 dark:hover:bg-indigo-400/10"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {mensajes.map((m) => (
            <React.Fragment key={m.id}>
              <Burbuja rol={m.rol}>{m.texto}</Burbuja>
              {m.borrador && (
                <div className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 text-sm dark:border-indigo-400/25 dark:bg-indigo-400/10">
                  <span className="text-xs font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-200">
                    Descripción propuesta
                  </span>
                  <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                    {m.borrador}
                  </p>
                  <button
                    type="button"
                    onClick={() => usarBorrador(m.borrador!)}
                    className={cn(
                      estiloAcento,
                      "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-semibold"
                    )}
                  >
                    <FileInputIcon className="size-4" />
                    Usar en el asistente
                  </button>
                </div>
              )}
            </React.Fragment>
          ))}

          {pensando && (
            <div
              className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-white/10"
              aria-label="El asistente está escribiendo"
            >
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="size-1.5 animate-bounce rounded-full bg-slate-400 motion-reduce:animate-none"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => enviar(mensajes)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100 dark:bg-white/10 dark:text-red-100"
              >
                <RotateCcwIcon className="size-3.5" />
                Reintentar
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            preguntar(texto)
          }}
          className="flex flex-col gap-1.5 border-t border-slate-200/70 p-3 dark:border-white/10"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-indigo-300 focus-within:ring-3 focus-within:ring-indigo-400/20 dark:border-white/10 dark:bg-white/5">
            <textarea
              ref={entrada}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault()
                  preguntar(texto)
                }
              }}
              rows={1}
              placeholder="Escribe tu pregunta…"
              aria-label="Tu mensaje"
              aria-invalid={excedido || undefined}
              className="field-sizing-content max-h-32 min-h-6 flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={pensando || !texto.trim() || excedido}
              aria-label="Enviar"
              className={cn(
                estiloAcento,
                "grid size-8 shrink-0 cursor-pointer place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              <ArrowUpIcon className="size-4" />
            </button>
          </div>
          <p className="px-1 text-[0.7rem] text-muted-foreground">
            {excedido
              ? `Máximo ${MAX_MENSAJE} caracteres por mensaje.`
              : "Respuestas generadas con IA. El importe exacto lo calcula el asistente de presupuestos."}
          </p>
        </form>
      </section>
    </>
  )
}

function Burbuja({
  rol,
  children,
}: {
  rol: "usuario" | "asistente"
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
        rol === "usuario"
          ? "self-end rounded-br-md bg-indigo-600 text-white"
          : "self-start rounded-bl-md bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100"
      )}
    >
      {children}
    </div>
  )
}
