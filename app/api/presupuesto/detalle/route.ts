import { leerJson } from "@/lib/http"
import { calcularDetalle, validarSeleccion } from "@/lib/seleccion"

// POST /api/presupuesto/detalle — selección confirmada → importes calculados por el servidor.
export async function POST(request: Request) {
  const lectura = await leerJson(request)
  if (!lectura.ok) return lectura.respuesta

  const seleccion = validarSeleccion(lectura.cuerpo)
  if (!seleccion.ok) {
    return Response.json({ errores: seleccion.errores }, { status: 400 })
  }
  return Response.json(calcularDetalle(seleccion.datos))
}
