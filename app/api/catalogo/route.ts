import { CATALOGO, PAGINAS } from "@/lib/catalogo"

export async function GET() {
  return Response.json({ moneda: "EUR", paginas: PAGINAS, servicios: CATALOGO })
}
