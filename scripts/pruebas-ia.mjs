// Pruebas del asistente (OpenAI) y del presupuesto en PDF.
// Requiere el servidor en marcha (npm run dev) y OPENAI_API_KEY en .env.local.
// Uso: npm run pruebas:ia
//      npm run pruebas:ia -- http://localhost:4000
//      npm run pruebas:ia -- https://tu-app.vercel.app
// Guarda el PDF del caso 6 en scripts/salida/ para revisarlo.

import { mkdir, writeFile } from "node:fs/promises"

const BASE = process.argv[2] ?? "http://localhost:3000"
let fallos = 0

function comprobar(nombre, ok, detalle = "") {
  if (!ok) fallos++
  console.log(`${ok ? "OK   " : "FALLO"} ${nombre}`)
  if (detalle) console.log(`      ${detalle}`)
}

async function post(ruta, cuerpo, cabeceras = {}) {
  const res = await fetch(`${BASE}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...cabeceras },
    body: JSON.stringify(cuerpo),
  })
  const tipo = res.headers.get("content-type") ?? ""
  const datos = tipo.includes("json") ? await res.json() : Buffer.from(await res.arrayBuffer())
  return { status: res.status, tipo, datos }
}

const ids = (p) => p.servicios.map((s) => s.id).sort().join(",")
const resumir = (p) =>
  `servicios=[${ids(p)}] paginas=${p.paginas} dudas=${p.dudas.length} fueraDeCatalogo=${p.fueraDeCatalogo.length}`

console.log(`Probando ${BASE}\n`)

// 1. Solicitud clara que encaja con el catálogo.
{
  const r = await post("/api/propuesta", {
    cliente: "Restaurante La Brasa (ficticio)",
    descripcion:
      "Necesito una web para un restaurante con cuatro páginas: inicio, carta, galería y contacto. Quiero un formulario para solicitar reservas y el contenido en castellano e inglés.",
  })
  comprobar(
    "1. Solicitud clara → corporativa + formulario + segundo idioma, 4 páginas",
    r.status === 200 &&
      ids(r.datos) === "corporativa,formulario,segundoIdioma" &&
      r.datos.paginas === 4,
    r.status === 200 ? resumir(r.datos) : JSON.stringify(r.datos)
  )
}

// 2. Solicitud ambigua que necesita aclaraciones.
{
  const r = await post("/api/propuesta", {
    cliente: "Ana Pérez (ficticio)",
    descripcion: "Quiero algo para internet para mi negocio, que quede bonito y moderno.",
  })
  comprobar(
    "2. Solicitud ambigua → devuelve dudas para aclarar",
    r.status === 200 && r.datos.dudas.length > 0 && r.datos.paginas === null,
    r.status === 200
      ? `${resumir(r.datos)}\n      dudas: ${r.datos.dudas.join(" | ")}`
      : JSON.stringify(r.datos)
  )
}

// 3. Servicio que no ofrecemos.
{
  const r = await post("/api/propuesta", {
    cliente: "Moda Lúa S.L. (ficticio)",
    descripcion:
      "Queremos una tienda online para vender ropa con pago con tarjeta, además de un blog y posicionamiento SEO.",
  })
  const ok =
    r.status === 200 &&
    r.datos.fueraDeCatalogo.length > 0 &&
    r.datos.servicios.every((s) => ["landing", "corporativa", "formulario", "segundoIdioma"].includes(s.id))
  comprobar(
    "3. Servicio no ofrecido → aparece en fueraDeCatalogo, sin inventar servicios",
    ok,
    r.status === 200
      ? `${resumir(r.datos)}\n      pendiente: ${r.datos.fueraDeCatalogo.map((f) => f.necesidad).join(" | ")}`
      : JSON.stringify(r.datos)
  )
}

// 4. Descripción vacía (no se llama a OpenAI).
{
  const r = await post("/api/propuesta", { cliente: "Prueba S.L.", descripcion: "   " })
  comprobar("4a. Descripción vacía → 400", r.status === 400, JSON.stringify(r.datos))
  const largo = await post("/api/propuesta", { cliente: "Prueba S.L.", descripcion: "a".repeat(2001) })
  comprobar("4b. Descripción de más de 2000 caracteres → 400", largo.status === 400, JSON.stringify(largo.datos))
}

// 5. Fallo en la llamada a OpenAI (simulado con una cabecera de prueba).
{
  const r = await post(
    "/api/propuesta",
    { cliente: "Prueba S.L.", descripcion: "Una landing para presentar mi academia de baile." },
    { "x-simular-fallo-ia": "1" }
  )
  comprobar(
    "5. Fallo de OpenAI → 502 con mensaje y reintentable",
    r.status === 502 && r.datos.reintentable === true && r.datos.errores?.length > 0,
    JSON.stringify(r.datos)
  )
}

// 6. Modificación de los servicios antes de descargar el PDF.
{
  const propuesta = {
    cliente: "Restaurante La Brasa (ficticio)",
    resumen: "Web para un restaurante con carta, solicitud de reservas y contenido en dos idiomas.",
    servicios: [
      { id: "corporativa", justificacion: "Necesita varias páginas con menú." },
      { id: "formulario", justificacion: "Para solicitar reservas." },
      { id: "segundoIdioma", justificacion: "Contenido en castellano e inglés." },
    ],
    paginas: 4,
    aclaraciones: ["¿Qué dos idiomas necesita exactamente?"],
  }
  const antes = await post("/api/presupuesto/detalle", propuesta)
  comprobar("6a. Propuesta original → 980 €", antes.datos.total === 980, `total=${antes.datos.total}`)

  // El usuario quita el segundo idioma, cambia a 5 páginas e intenta colar un precio.
  const modificada = {
    ...propuesta,
    servicios: propuesta.servicios.filter((s) => s.id !== "segundoIdioma"),
    paginas: 5,
    total: 1,
    precio: 0,
  }
  const despues = await post("/api/presupuesto/detalle", modificada)
  comprobar(
    "6b. Sin segundo idioma y 5 páginas → 600 + 4×50 + 80 = 880 € (ignora total/precio enviados)",
    despues.status === 200 && despues.datos.total === 880,
    `total=${despues.datos.total} líneas=${despues.datos.lineas?.map((l) => `${l.concepto}:${l.importe}`).join(", ")}`
  )

  const pdf = await post("/api/presupuesto/pdf", modificada)
  const esPdf = pdf.status === 200 && pdf.tipo.includes("application/pdf") && pdf.datos.subarray(0, 4).toString() === "%PDF"
  if (esPdf) {
    await mkdir(new URL("./salida/", import.meta.url), { recursive: true })
    await writeFile(new URL("./salida/presupuesto-prueba.pdf", import.meta.url), pdf.datos)
  }
  comprobar(
    "6c. El PDF se genera con la selección modificada",
    esPdf,
    esPdf ? `${pdf.datos.length} bytes → scripts/salida/presupuesto-prueba.pdf` : JSON.stringify(pdf.datos)
  )

  const invalida = await post("/api/presupuesto/detalle", {
    ...propuesta,
    servicios: [{ id: "tiendaOnline" }, { id: "formulario" }],
    paginas: null,
  })
  comprobar(
    "6d. Servicio inexistente, sin tipo de web y sin páginas → 400",
    invalida.status === 400,
    JSON.stringify(invalida.datos)
  )
}

// 7. Chat de ayuda.
{
  const tarifas = new Set([300, 600, 50, 80, 150])
  const importesNoOficiales = (texto) =>
    [...texto.matchAll(/(\d[\d.]*)\s?€/g)]
      .map((m) => Number(m[1].replaceAll(".", "")))
      .filter((n) => !tarifas.has(n))

  const r = await post("/api/chat", {
    mensajes: [{ rol: "usuario", texto: "¿Cuánto cuesta una web corporativa?" }],
  })
  comprobar(
    "7a. Chat: cita la tarifa oficial de la web corporativa (600 €)",
    r.status === 200 && /600\s?€/.test(r.datos.respuesta),
    r.status === 200 ? r.datos.respuesta.replaceAll("\n", " ") : JSON.stringify(r.datos)
  )

  const total = await post("/api/chat", {
    mensajes: [
      {
        rol: "usuario",
        texto:
          "¿Cuánto me sale en total una corporativa de 5 páginas con formulario? ¿Y cuánto tardáis?",
      },
    ],
  })
  comprobar(
    "7b. Chat: no da totales calculados ni importes fuera de las tarifas",
    total.status === 200 && importesNoOficiales(total.datos.respuesta).length === 0,
    total.status === 200 ? total.datos.respuesta.replaceAll("\n", " ") : JSON.stringify(total.datos)
  )

  const borrador = await post("/api/chat", {
    mensajes: [
      {
        rol: "usuario",
        texto:
          "Quiero presupuesto para la web de mi clínica: inicio, servicios, equipo y contacto, formulario para pedir cita y solo en castellano.",
      },
    ],
  })
  comprobar(
    "7c. Chat: redacta un borrador de descripción para el asistente",
    borrador.status === 200 && typeof borrador.datos.borradorDescripcion === "string",
    borrador.status === 200 ? `borrador: ${borrador.datos.borradorDescripcion}` : JSON.stringify(borrador.datos)
  )

  const vacio = await post("/api/chat", { mensajes: [{ rol: "usuario", texto: "  " }] })
  comprobar("7d. Chat: mensaje vacío → 400", vacio.status === 400, JSON.stringify(vacio.datos))

  const fallo = await post(
    "/api/chat",
    { mensajes: [{ rol: "usuario", texto: "Hola" }] },
    { "x-simular-fallo-ia": "1" }
  )
  comprobar(
    "7e. Chat: fallo de OpenAI → 502 reintentable",
    fallo.status === 502 && fallo.datos.reintentable === true,
    JSON.stringify(fallo.datos)
  )
}

console.log(`\n${fallos === 0 ? "Todas las pruebas pasan." : `${fallos} prueba(s) fallan.`}`)
process.exitCode = fallos === 0 ? 0 : 1
