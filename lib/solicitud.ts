import { esObjeto } from "./http"

// Solicitud que escribe el cliente antes de llamar a la IA.
export const LIMITES_SOLICITUD = {
  clienteMin: 2,
  clienteMax: 100,
  descripcionMin: 15,
  descripcionMax: 2000,
} as const

export type Solicitud = { cliente: string; descripcion: string }

type Resultado =
  { ok: true; datos: Solicitud } | { ok: false; errores: string[] }

export function validarSolicitud(entrada: unknown): Resultado {
  if (!esObjeto(entrada)) {
    return { ok: false, errores: ["El cuerpo debe ser un objeto JSON."] }
  }
  const { clienteMin, clienteMax, descripcionMin, descripcionMax } =
    LIMITES_SOLICITUD
  const errores: string[] = []

  const cliente =
    typeof entrada.cliente === "string" ? entrada.cliente.trim() : ""
  if (cliente.length === 0) {
    errores.push("Indica el nombre del cliente o de la empresa.")
  } else if (cliente.length < clienteMin || cliente.length > clienteMax) {
    errores.push(
      `El nombre debe tener entre ${clienteMin} y ${clienteMax} caracteres.`
    )
  }

  const descripcion =
    typeof entrada.descripcion === "string" ? entrada.descripcion.trim() : ""
  if (descripcion.length === 0) {
    errores.push("La descripción del proyecto no puede estar vacía.")
  } else if (descripcion.length < descripcionMin) {
    errores.push(
      `La descripción es demasiado breve: explica el proyecto en al menos ${descripcionMin} caracteres.`
    )
  } else if (descripcion.length > descripcionMax) {
    errores.push(
      `La descripción no puede superar los ${descripcionMax} caracteres (tiene ${descripcion.length}).`
    )
  }

  if (errores.length > 0) return { ok: false, errores }
  return { ok: true, datos: { cliente, descripcion } }
}
