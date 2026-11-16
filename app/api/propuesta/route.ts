import { leerJson } from "@/lib/http"
import { ErrorIA, respuestaErrorIA } from "@/lib/ia/openai"
import { pedirPropuesta } from "@/lib/ia/propuesta"
import { validarSolicitud } from "@/lib/solicitud"

export const maxDuration = 60

// POST /api/propuesta — { cliente, descripcion } → propuesta de servicios de la IA.
export async function POST(request: Request) {
  const lectura = await leerJson(request)
  if (!lectura.ok) return lectura.respuesta

  const solicitud = validarSolicitud(lectura.cuerpo)
  if (!solicitud.ok) {
    return Response.json({ errores: solicitud.errores }, { status: 400 })
  }

  // Para probar la gestión de errores sin gastar llamadas: cabecera
  // "x-simular-fallo-ia: 1". Solo provoca un error, no expone nada.
  if (request.headers.get("x-simular-fallo-ia") === "1") {
    return respuestaErrorIA(
      new ErrorIA("Fallo simulado del asistente.", 502, "simulado"),
      "propuesta"
    )
  }

  try {
    return Response.json(await pedirPropuesta(solicitud.datos))
  } catch (error) {
    return respuestaErrorIA(error, "propuesta")
  }
}
