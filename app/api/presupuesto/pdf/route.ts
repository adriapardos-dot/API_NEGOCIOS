import { renderToBuffer } from "@react-pdf/renderer"

import { leerJson } from "@/lib/http"
import { DocumentoPresupuesto } from "@/lib/pdf/documento-presupuesto"
import { calcularDetalle, validarSeleccion } from "@/lib/seleccion"

// POST /api/presupuesto/pdf — misma entrada que /detalle. Los importes se
// vuelven a calcular aquí: el PDF nunca usa cifras enviadas por el navegador.
export async function POST(request: Request) {
  const lectura = await leerJson(request)
  if (!lectura.ok) return lectura.respuesta

  const seleccion = validarSeleccion(lectura.cuerpo)
  if (!seleccion.ok) {
    return Response.json({ errores: seleccion.errores }, { status: 400 })
  }

  const detalle = calcularDetalle(seleccion.datos)
  try {
    const pdf = await renderToBuffer(DocumentoPresupuesto({ detalle }))
    const nombre = `presupuesto-${slug(detalle.cliente)}-${detalle.fecha}.pdf`
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombre}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[pdf] error al generar", error)
    return Response.json(
      { errores: ["No se ha podido generar el PDF. Inténtalo de nuevo."] },
      { status: 500 }
    )
  }
}

function slug(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "cliente"
  )
}
