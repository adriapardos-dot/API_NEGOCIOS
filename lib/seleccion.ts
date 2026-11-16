import { CATALOGO, PAGINAS, esIdServicio, servicioPorId } from "./catalogo"
import type { IdServicio } from "./catalogo"
import { esObjeto } from "./http"
import { TARIFAS, calcularPresupuesto, type TipoWeb } from "./presupuesto"

// Selección final que confirma el usuario tras revisar la propuesta de la IA.
// Solo contiene identificadores y textos: los importes los calcula siempre el
// servidor a partir de TARIFAS, nunca se aceptan precios del cliente.

export const LIMITES_SELECCION = {
  resumenMax: 1200,
  justificacionMax: 400,
  aclaracionesMax: 20,
  aclaracionMax: 400,
} as const

export type ServicioSeleccionado = { id: IdServicio; justificacion: string }

export type Seleccion = {
  cliente: string
  resumen: string
  servicios: ServicioSeleccionado[]
  paginas: number
  aclaraciones: string[]
}

export type LineaPresupuesto = {
  concepto: string
  detalle: string
  importe: number
}

export type PresupuestoDetallado = {
  referencia: string // p. ej. PMW-20261116-3F9A: misma selección → misma referencia
  cliente: string
  fecha: string // AAAA-MM-DD, la pone el servidor
  resumen: string
  servicios: {
    id: IdServicio
    nombre: string
    descripcion: string
    justificacion: string
  }[]
  paginas: number
  lineas: LineaPresupuesto[]
  total: number
  moneda: "EUR"
  aclaraciones: string[]
}

type Resultado =
  { ok: true; datos: Seleccion } | { ok: false; errores: string[] }

const texto = (valor: unknown) =>
  typeof valor === "string" ? valor.trim() : ""

export function validarSeleccion(entrada: unknown): Resultado {
  if (!esObjeto(entrada)) {
    return { ok: false, errores: ["El cuerpo debe ser un objeto JSON."] }
  }
  const L = LIMITES_SELECCION
  const errores: string[] = []

  const cliente = texto(entrada.cliente)
  if (cliente.length < 2 || cliente.length > 100) {
    errores.push("El nombre del cliente debe tener entre 2 y 100 caracteres.")
  }

  const resumen = texto(entrada.resumen)
  if (resumen.length === 0) {
    errores.push("El resumen del proyecto no puede estar vacío.")
  } else if (resumen.length > L.resumenMax) {
    errores.push(`El resumen no puede superar ${L.resumenMax} caracteres.`)
  }

  // Servicios: solo identificadores del catálogo, sin repetir, y un único tipo de web.
  const servicios: ServicioSeleccionado[] = []
  if (!Array.isArray(entrada.servicios)) {
    errores.push('"servicios" debe ser una lista.')
  } else {
    for (const item of entrada.servicios) {
      const id = esObjeto(item) ? item.id : item
      if (!esIdServicio(id)) {
        errores.push(`El servicio "${String(id)}" no existe en el catálogo.`)
        continue
      }
      if (servicios.some((s) => s.id === id)) {
        errores.push(`El servicio "${id}" está repetido.`)
        continue
      }
      const justificacion = esObjeto(item) ? texto(item.justificacion) : ""
      if (justificacion.length > L.justificacionMax) {
        errores.push(`La explicación de "${id}" es demasiado larga.`)
        continue
      }
      servicios.push({ id, justificacion })
    }
    const bases = servicios.filter(
      (s) => servicioPorId(s.id).categoria === "base"
    )
    if (bases.length === 0) {
      errores.push(
        "Elige un tipo de web (landing o corporativa): es necesario para calcular el presupuesto."
      )
    } else if (bases.length > 1) {
      errores.push("Elige solo un tipo de web: landing o corporativa.")
    }
  }

  const paginas = entrada.paginas
  if (
    typeof paginas !== "number" ||
    !Number.isInteger(paginas) ||
    paginas < PAGINAS.min ||
    paginas > PAGINAS.max
  ) {
    errores.push(
      `Indica el número de páginas: un número entero entre ${PAGINAS.min} y ${PAGINAS.max}.`
    )
  }

  const aclaraciones: string[] = []
  if (entrada.aclaraciones !== undefined) {
    if (!Array.isArray(entrada.aclaraciones)) {
      errores.push('"aclaraciones" debe ser una lista de textos.')
    } else {
      for (const a of entrada.aclaraciones) {
        const t = texto(a)
        if (!t) continue
        if (t.length > L.aclaracionMax) {
          errores.push(
            `Cada aclaración puede tener hasta ${L.aclaracionMax} caracteres.`
          )
          break
        }
        aclaraciones.push(t)
      }
      if (aclaraciones.length > L.aclaracionesMax) {
        errores.push(`Como máximo ${L.aclaracionesMax} aclaraciones.`)
      }
    }
  }

  if (errores.length > 0) return { ok: false, errores }
  // Se ordenan como en el catálogo para que el documento sea siempre coherente.
  servicios.sort(
    (a, b) =>
      CATALOGO.findIndex((s) => s.id === a.id) -
      CATALOGO.findIndex((s) => s.id === b.id)
  )
  return {
    ok: true,
    datos: {
      cliente,
      resumen,
      servicios,
      paginas: paginas as number,
      aclaraciones,
    },
  }
}

const formatoEuros = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    useGrouping: "always",
  }).format(n)

// Reutiliza calcularPresupuesto (las tarifas del ejercicio anterior) y lo
// convierte en líneas con concepto y detalle para la vista previa y el PDF.
export function calcularDetalle(
  seleccion: Seleccion,
  fecha = new Date()
): PresupuestoDetallado {
  const ids = seleccion.servicios.map((s) => s.id)
  const tipo = ids.find(
    (id) => id === "landing" || id === "corporativa"
  ) as TipoWeb

  const importes = calcularPresupuesto({
    tipo,
    paginas: seleccion.paginas,
    formulario: ids.includes("formulario"),
    segundoIdioma: ids.includes("segundoIdioma"),
  })

  const lineas: LineaPresupuesto[] = [
    {
      concepto: servicioPorId(tipo).nombre,
      detalle: "Incluye la primera página",
      importe: importes.base,
    },
  ]
  const extra = seleccion.paginas - 1
  if (extra > 0) {
    lineas.push({
      concepto: "Páginas adicionales",
      detalle: `${extra} × ${formatoEuros(TARIFAS.paginaAdicional)}`,
      importe: importes.paginasAdicionales,
    })
  }
  if (ids.includes("formulario")) {
    lineas.push({
      concepto: servicioPorId("formulario").nombre,
      detalle: "Precio fijo",
      importe: importes.formulario,
    })
  }
  if (ids.includes("segundoIdioma")) {
    lineas.push({
      concepto: servicioPorId("segundoIdioma").nombre,
      detalle: "Precio fijo",
      importe: importes.segundoIdioma,
    })
  }

  const dia = fechaLocal(fecha)
  return {
    referencia: `PMW-${dia.replaceAll("-", "")}-${huella(JSON.stringify(seleccion))}`,
    cliente: seleccion.cliente,
    fecha: dia,
    resumen: seleccion.resumen,
    servicios: seleccion.servicios.map((s) => {
      const servicio = servicioPorId(s.id)
      return {
        id: s.id,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        justificacion: s.justificacion,
      }
    }),
    paginas: seleccion.paginas,
    lineas,
    total: importes.total,
    moneda: "EUR",
    aclaraciones: seleccion.aclaraciones,
  }
}

// Fecha en horario de Madrid (Vercel ejecuta en UTC).
function fechaLocal(fecha: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha)
}

// Huella corta (FNV-1a) para la referencia del presupuesto.
function huella(texto: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 4)
}
