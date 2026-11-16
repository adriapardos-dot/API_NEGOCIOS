import { leerJson } from "@/lib/http"
import { responderChat, validarMensajes } from "@/lib/ia/chat"
import { ErrorIA, respuestaErrorIA } from "@/lib/ia/openai"

export const maxDuration = 60

// POST /api/chat — { mensajes: [{ rol: "usuario" | "asistente", texto }] }
// → { respuesta, borradorDescripcion }
export async function POST(request: Request) {
  const lectura = await leerJson(request)
  if (!lectura.ok) return lectura.respuesta

  const validacion = validarMensajes(lectura.cuerpo)
  if (!validacion.ok) {
    return Response.json({ errores: validacion.errores }, { status: 400 })
  }

  if (request.headers.get("x-simular-fallo-ia") === "1") {
    return respuestaErrorIA(
      new ErrorIA("Fallo simulado del asistente.", 502, "simulado"),
      "chat"
    )
  }

  try {
    return Response.json(await responderChat(validacion.mensajes))
  } catch (error) {
    return respuestaErrorIA(error, "chat")
  }
}
