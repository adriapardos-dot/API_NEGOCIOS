import { TARIFAS } from "@/lib/presupuesto"

export async function GET() {
  return Response.json({ moneda: "EUR", tarifas: TARIFAS })
}
