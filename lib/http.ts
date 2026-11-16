// Utilidades compartidas por las rutas que reciben JSON.

type Lectura =
  { ok: true; cuerpo: unknown } | { ok: false; respuesta: Response }

// Comprueba la cabecera Content-Type y lee el cuerpo como JSON.
export async function leerJson(request: Request): Promise<Lectura> {
  const tipoContenido = request.headers.get("content-type") ?? ""
  if (tipoContenido.split(";")[0].trim().toLowerCase() !== "application/json") {
    return {
      ok: false,
      respuesta: Response.json(
        { errores: ['La cabecera Content-Type debe ser "application/json".'] },
        { status: 415 }
      ),
    }
  }
  try {
    return { ok: true, cuerpo: await request.json() }
  } catch {
    return {
      ok: false,
      respuesta: Response.json(
        { errores: ["El cuerpo de la petición no es un JSON válido."] },
        { status: 400 }
      ),
    }
  }
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor)
}
