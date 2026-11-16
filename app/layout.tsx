import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ChatAyuda } from "@/components/chat/chat-ayuda"
import { EncabezadoSitio } from "@/components/encabezado-sitio"
import { FondoDecorativo } from "@/components/fondo-decorativo"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Presupuesta mi web · Asistente de presupuestos",
  description:
    "Explica tu proyecto, recibe una propuesta de servicios con IA, revísala y descarga el presupuesto en PDF.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <FondoDecorativo />
          <EncabezadoSitio />
          {children}
          <ChatAyuda />
        </ThemeProvider>
      </body>
    </html>
  )
}
