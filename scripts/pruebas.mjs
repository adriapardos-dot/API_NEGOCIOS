// Prueba las tres rutas de la API. Requiere el servidor en marcha (npm run dev).
// Uso: npm run pruebas            (por defecto http://localhost:3000)
//      npm run pruebas -- http://localhost:4000

const BASE = process.argv[2] ?? "http://localhost:3000"

// Solicitud válida del enunciado; los casos inválidos cambian un solo campo.
const valida = {
  tipo: "corporativa",
  paginas: 4,
  formulario: true,
  segundoIdioma: false,
}

const casos = [
  {
    n: 1,
    nombre: "Landing, 1 página, sin extras",
    cuerpo: {
      tipo: "landing",
      paginas: 1,
      formulario: false,
      segundoIdioma: false,
    },
    estado: 200,
    total: 300,
  },
  {
    n: 2,
    nombre: "Corporativa, 4 páginas, formulario y sin segundo idioma",
    cuerpo: valida,
    estado: 200,
    total: 830,
  },
  {
    n: 3,
    nombre: "Landing, 2 páginas, ambos extras",
    cuerpo: {
      tipo: "landing",
      paginas: 2,
      formulario: true,
      segundoIdioma: true,
    },
    estado: 200,
    total: 580,
  },
  {
    n: 4,
    nombre: "Landing, 20 páginas, sin extras",
    cuerpo: {
      tipo: "landing",
      paginas: 20,
      formulario: false,
      segundoIdioma: false,
    },
    estado: 200,
    total: 1250,
  },
  {
    n: 5,
    nombre: "paginas: 0",
    cuerpo: { ...valida, paginas: 0 },
    estado: 400,
  },
  {
    n: 6,
    nombre: "paginas: 21",
    cuerpo: { ...valida, paginas: 21 },
    estado: 400,
  },
  {
    n: 7,
    nombre: "paginas: 2.5",
    cuerpo: { ...valida, paginas: 2.5 },
    estado: 400,
  },
  {
    n: 8,
    nombre: 'tipo: "tienda"',
    cuerpo: { ...valida, tipo: "tienda" },
    estado: 400,
  },
  {
    n: 9,
    nombre: 'formulario: "false"',
    cuerpo: { ...valida, formulario: "false" },
    estado: 400,
  },
]

let fallos = 0

function comprobar(nombre, ok, detalle) {
  if (!ok) fallos++
  console.log(`${ok ? "OK  " : "FALLO"} ${nombre}`)
  console.log(`      ${detalle}`)
}

async function probarGet(ruta, validar) {
  const res = await fetch(`${BASE}${ruta}`)
  const json = await res.json()
  comprobar(
    `GET ${ruta}`,
    res.status === 200 && validar(json),
    `${res.status} ${JSON.stringify(json)}`
  )
}

console.log(`Probando ${BASE}\n`)

await probarGet("/api/estado", (j) => j.status === "ok")
await probarGet(
  "/api/tarifas",
  (j) =>
    j.tarifas?.landing === 300 &&
    j.tarifas?.corporativa === 600 &&
    j.tarifas?.paginaAdicional === 50 &&
    j.tarifas?.formulario === 80 &&
    j.tarifas?.segundoIdioma === 150
)

console.log("\nPOST /api/presupuesto")
for (const caso of casos) {
  const res = await fetch(`${BASE}/api/presupuesto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caso.cuerpo),
  })
  const json = await res.json()
  const ok =
    res.status === caso.estado &&
    (caso.total === undefined || json.total === caso.total)
  const esperado =
    caso.total === undefined
      ? `${caso.estado}`
      : `${caso.estado} · Total: ${caso.total} €`
  comprobar(
    `Caso ${caso.n}: ${caso.nombre}  (esperado ${esperado})`,
    ok,
    `${res.status} ${JSON.stringify(json)}`
  )
}

console.log(
  `\n${fallos === 0 ? "Todas las pruebas pasan." : `${fallos} prueba(s) fallan.`}`
)
process.exitCode = fallos === 0 ? 0 : 1
