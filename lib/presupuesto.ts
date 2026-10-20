// Tarifas del servidor (en euros). Nunca se usan precios enviados por el cliente.
export const TARIFAS = {
  landing: 300,
  corporativa: 600,
  paginaAdicional: 50,
  formulario: 80,
  segundoIdioma: 150,
} as const

export const TIPOS_WEB = ["landing", "corporativa"] as const
export type TipoWeb = (typeof TIPOS_WEB)[number]

export const PAGINAS_MIN = 1
export const PAGINAS_MAX = 20

const CAMPOS_OBLIGATORIOS = [
  "tipo",
  "paginas",
  "formulario",
  "segundoIdioma",
] as const

export type DatosWeb = {
  tipo: TipoWeb
  paginas: number
  formulario: boolean
  segundoIdioma: boolean
}

// Cada concepto es su importe en euros (0 si no se aplica).
export type Presupuesto = {
  base: number
  paginasAdicionales: number
  formulario: number
  segundoIdioma: number
  total: number
  moneda: "EUR"
}

type ResultadoValidacion =
  { ok: true; datos: DatosWeb } | { ok: false; errores: string[] }

// Solo se leen los campos esperados; cualquier otro (precio, total...) se ignora.
export function validarDatos(entrada: unknown): ResultadoValidacion {
  if (
    typeof entrada !== "object" ||
    entrada === null ||
    Array.isArray(entrada)
  ) {
    return { ok: false, errores: ["El cuerpo debe ser un objeto JSON."] }
  }

  const cuerpo = entrada as Record<string, unknown>
  const faltan = CAMPOS_OBLIGATORIOS.filter((campo) => !(campo in cuerpo))
  if (faltan.length > 0) {
    return {
      ok: false,
      errores: faltan.map((campo) => `Falta el campo obligatorio "${campo}".`),
    }
  }

  const { tipo, paginas, formulario, segundoIdioma } = cuerpo
  const errores: string[] = []

  if (!TIPOS_WEB.includes(tipo as TipoWeb)) {
    errores.push(`"tipo" debe ser "landing" o "corporativa".`)
  }
  // typeof descarta cadenas como "4"; isInteger descarta decimales.
  if (
    typeof paginas !== "number" ||
    !Number.isInteger(paginas) ||
    paginas < PAGINAS_MIN ||
    paginas > PAGINAS_MAX
  ) {
    errores.push(
      `"paginas" debe ser un número entero entre ${PAGINAS_MIN} y ${PAGINAS_MAX}.`
    )
  }
  // typeof descarta cadenas como "false".
  if (typeof formulario !== "boolean") {
    errores.push('"formulario" debe ser un booleano: true o false.')
  }
  if (typeof segundoIdioma !== "boolean") {
    errores.push('"segundoIdioma" debe ser un booleano: true o false.')
  }

  if (errores.length > 0) return { ok: false, errores }

  return {
    ok: true,
    datos: {
      tipo: tipo as TipoWeb,
      paginas: paginas as number,
      formulario: formulario as boolean,
      segundoIdioma: segundoIdioma as boolean,
    },
  }
}

// Recibe datos ya validados. Total = base + páginas adicionales + extras.
export function calcularPresupuesto(datos: DatosWeb): Presupuesto {
  const base = TARIFAS[datos.tipo] // incluye la primera página
  const paginasAdicionales = (datos.paginas - 1) * TARIFAS.paginaAdicional
  const formulario = datos.formulario ? TARIFAS.formulario : 0
  const segundoIdioma = datos.segundoIdioma ? TARIFAS.segundoIdioma : 0

  return {
    base,
    paginasAdicionales,
    formulario,
    segundoIdioma,
    total: base + paginasAdicionales + formulario + segundoIdioma,
    moneda: "EUR",
  }
}
