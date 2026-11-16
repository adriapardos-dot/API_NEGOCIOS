import OpenAI from "openai"

// Conexión con OpenAI compartida por la propuesta y el chat.
// Solo se usa en rutas del servidor: la clave se lee de process.env y nunca
// llega al navegador (no lleva el prefijo NEXT_PUBLIC_).

export const MODELO_POR_DEFECTO = "gpt-5.4-mini"

export class ErrorIA extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly causa: string
  ) {
    super(message)
  }
}

type Mensaje = { role: "user" | "assistant"; content: string }

// Hace la llamada con salida estructurada (json_schema estricto) y devuelve el
// JSON ya parseado. La validación del contenido la hace quien llama.
export async function pedirJson(opciones: {
  instrucciones: string
  entrada: Mensaje[]
  nombreEsquema: string
  esquema: Record<string, unknown>
  maxTokens?: number
}): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new ErrorIA(
      "El asistente no está configurado en el servidor (falta OPENAI_API_KEY).",
      503,
      "sin-clave"
    )
  }

  const cliente = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 })

  let salida: string
  try {
    const respuesta = await cliente.responses.create({
      model: process.env.OPENAI_MODEL || MODELO_POR_DEFECTO,
      instructions: opciones.instrucciones,
      input: opciones.entrada,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: opciones.nombreEsquema,
          strict: true,
          schema: opciones.esquema,
        },
      },
      max_output_tokens: opciones.maxTokens ?? 4000,
      store: false,
    })

    if (respuesta.status === "incomplete") {
      throw new ErrorIA(
        "La respuesta del asistente llegó incompleta.",
        502,
        `incompleta: ${respuesta.incomplete_details?.reason ?? "desconocido"}`
      )
    }
    salida = respuesta.output_text
  } catch (error) {
    throw traducirError(error)
  }

  try {
    return JSON.parse(salida)
  } catch {
    throw new ErrorIA(
      "El asistente devolvió una respuesta que no se puede procesar.",
      502,
      "json-invalido"
    )
  }
}

function traducirError(error: unknown): ErrorIA {
  if (error instanceof ErrorIA) return error
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new ErrorIA(
      "El asistente ha tardado demasiado en responder.",
      504,
      "timeout"
    )
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new ErrorIA(
      "No se ha podido conectar con el asistente.",
      502,
      "conexion"
    )
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new ErrorIA(
      "El asistente está saturado en este momento.",
      503,
      "limite"
    )
  }
  if (error instanceof OpenAI.AuthenticationError) {
    return new ErrorIA(
      "El asistente no está disponible (credenciales no válidas en el servidor).",
      502,
      "autenticacion"
    )
  }
  if (error instanceof OpenAI.APIError) {
    return new ErrorIA(
      "El asistente ha devuelto un error.",
      502,
      `api-${error.status}`
    )
  }
  return new ErrorIA(
    "Error inesperado al consultar al asistente.",
    502,
    "desconocido"
  )
}

// Respuesta de error común para las rutas que usan la IA. El detalle técnico
// va al registro del servidor, no al cliente.
export function respuestaErrorIA(error: unknown, ruta: string) {
  const e =
    error instanceof ErrorIA
      ? error
      : new ErrorIA("Error inesperado en el asistente.", 500, "interno")
  if (!(error instanceof ErrorIA)) console.error(`[${ruta}]`, error)
  console.error(`[${ruta}] ${e.causa}: ${e.message}`)
  return Response.json(
    {
      errores: [`${e.message} Puedes volver a intentarlo.`],
      reintentable: true,
    },
    { status: e.status }
  )
}

// Frases con plazos de entrega o compromisos que la IA no debe ofrecer.
export const PLAZO =
  /\b(en|plazo de|entrega en|lista en|listo en|listas en|listos en)\s+(\d+|un|una|dos|tres|cuatro)\s+(d[ií]as?|semanas?|meses?)\b/i

export function frases(texto: string) {
  return texto.trim().split(/(?<=[.!?])\s+/)
}
