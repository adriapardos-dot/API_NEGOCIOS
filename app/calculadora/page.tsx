import type { Metadata } from "next"

import { CalculadoraPresupuesto } from "@/components/calculadora-presupuesto"

export const metadata: Metadata = { title: "Calculadora · Presupuesta mi web" }

export default function Page() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <CalculadoraPresupuesto />
    </main>
  )
}
