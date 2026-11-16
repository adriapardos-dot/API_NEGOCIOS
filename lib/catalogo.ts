import { PAGINAS_MAX, PAGINAS_MIN, TARIFAS } from "./presupuesto"

// Catálogo de servicios: es el mismo del ejercicio anterior (las tarifas salen
// de TARIFAS), descrito para que la IA y el PDF sepan qué incluye cada uno.
// La IA solo puede proponer estos identificadores; los precios nunca se le piden.

export const IDS_SERVICIO = [
  "landing",
  "corporativa",
  "formulario",
  "segundoIdioma",
] as const
export type IdServicio = (typeof IDS_SERVICIO)[number]

export type ServicioCatalogo = {
  id: IdServicio
  nombre: string
  // "base": tipo de web (hay que elegir exactamente uno). "extra": se suma a la base.
  categoria: "base" | "extra"
  descripcion: string
  noIncluye: string
  precio: number
  regla: string
}

const euros = (n: number) => `${n.toLocaleString("es-ES")} €`

export const CATALOGO: readonly ServicioCatalogo[] = [
  {
    id: "landing",
    nombre: "Landing page",
    categoria: "base",
    descripcion:
      "Web sencilla de presentación orientada a un objetivo concreto (dar a conocer un negocio, un producto o un evento). Diseño adaptado a móvil.",
    noIncluye:
      "Navegación compleja entre muchas secciones; para eso está la web corporativa.",
    precio: TARIFAS.landing,
    regla: `${euros(TARIFAS.landing)} con la primera página incluida; ${euros(TARIFAS.paginaAdicional)} por cada página adicional (máximo ${PAGINAS_MAX}).`,
  },
  {
    id: "corporativa",
    nombre: "Web corporativa",
    categoria: "base",
    descripcion:
      "Web completa de empresa con varias páginas (inicio, quiénes somos, servicios, contacto…), menú de navegación y diseño adaptado a móvil.",
    noIncluye:
      "Tienda online, pagos, zona privada de usuarios ni gestor de contenidos o blog.",
    precio: TARIFAS.corporativa,
    regla: `${euros(TARIFAS.corporativa)} con la primera página incluida; ${euros(TARIFAS.paginaAdicional)} por cada página adicional (máximo ${PAGINAS_MAX}).`,
  },
  {
    id: "formulario",
    nombre: "Formulario web",
    categoria: "extra",
    descripcion:
      "Formulario (contacto, solicitud de reserva, petición de información…) que envía por correo electrónico los datos que rellena el visitante.",
    noIncluye:
      "Gestión de disponibilidad o calendario de reservas, pagos ni panel de administración.",
    precio: TARIFAS.formulario,
    regla: `${euros(TARIFAS.formulario)} (precio fijo).`,
  },
  {
    id: "segundoIdioma",
    nombre: "Segundo idioma",
    categoria: "extra",
    descripcion:
      "Todo el contenido de la web disponible en un segundo idioma, con selector de idioma.",
    noIncluye: "Un tercer idioma o más.",
    precio: TARIFAS.segundoIdioma,
    regla: `${euros(TARIFAS.segundoIdioma)} (precio fijo).`,
  },
]

export const PAGINAS = { min: PAGINAS_MIN, max: PAGINAS_MAX } as const

export function esIdServicio(valor: unknown): valor is IdServicio {
  return typeof valor === "string" && IDS_SERVICIO.includes(valor as IdServicio)
}

export function servicioPorId(id: IdServicio): ServicioCatalogo {
  return CATALOGO.find((s) => s.id === id)!
}
