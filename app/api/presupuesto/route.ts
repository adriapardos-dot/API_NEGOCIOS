import { calcularPresupuesto, validarDatos } from "@/lib/presupuesto"

export async function POST(request: Request) {
  // Acepta "application/json" con parámetros opcionales (p. ej. "; charset=utf-8").
  const tipoContenido = request.headers.get("content-type") ?? ""
  if (tipoContenido.split(";")[0].trim().toLowerCase() !== "application/json") {
    return Response.json(
      { errores: ['La cabecera Content-Type debe ser "application/json".'] },
      { status: 415 }
    )
  }

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json(
      { errores: ["El cuerpo de la petición no es un JSON válido."] },
      { status: 400 }
    )
  }

  const resultado = validarDatos(cuerpo)
  if (!resultado.ok) {
    return Response.json({ errores: resultado.errores }, { status: 400 })
  }

  return Response.json(calcularPresupuesto(resultado.datos))
}
