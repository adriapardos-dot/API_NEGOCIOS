import type { IdServicio } from "@/lib/catalogo"

// Respuesta de POST /api/propuesta (ya validada por el servidor).
export type Propuesta = {
  resumen: string
  servicios: { id: IdServicio; justificacion: string }[]
  paginas: number | null
  dudas: string[]
  fueraDeCatalogo: { necesidad: string; motivo: string }[]
  avisos: string[]
}

export type ServicioElegido = {
  id: IdServicio
  justificacion: string
  origen: "ia" | "usuario"
}

export type Aclaracion = {
  id: number
  texto: string
  tipo: "duda" | "pendiente" | "nota"
}

export const euros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
})
