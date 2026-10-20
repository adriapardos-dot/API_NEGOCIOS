# API de presupuestos web

Servicio que recibe las características de una web, comprueba los datos y devuelve un presupuesto desglosado. Hecho con Next.js (Route Handlers) y TypeScript. Incluye una interfaz web que usa la API.

## Requisitos

- [Node.js](https://nodejs.org/) **20.9 o superior** (incluye `npm`). Comprobar con `node -v`.
- Conexión a internet en la instalación (descarga de dependencias).

## Instalación

Todos los comandos se ejecutan **en la carpeta que contiene `package.json`** (la raíz del repositorio):

```
git clone <url-del-repositorio>
cd <carpeta-del-repositorio>
npm install
```

`npm install` lee `package.json` y `package-lock.json` e instala las versiones exactas de las dependencias en `node_modules` (que no se incluye en el repositorio).

## Ejecución

**Desarrollo:**

```
npm run dev
```

**Producción:**

```
npm run build
npm start
```

## Puerto

El servidor escucha en el **puerto 3000**: `http://localhost:3000`.

Para usar otro puerto (por ejemplo, si el 3000 está ocupado):

```
npm run dev -- -p 4000
npm start -- -p 4000
```

## Rutas

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/estado` | Confirma que el servicio funciona: `{"status":"ok"}` |
| GET | `/api/tarifas` | Devuelve las tarifas que usa el servidor |
| POST | `/api/presupuesto` | Valida la solicitud y devuelve el presupuesto |
| GET | `/` | Interfaz web para calcular presupuestos |

### GET /api/estado

```json
{ "status": "ok" }
```

### GET /api/tarifas

```json
{
  "moneda": "EUR",
  "tarifas": { "landing": 300, "corporativa": 600, "paginaAdicional": 50, "formulario": 80, "segundoIdioma": 150 }
}
```

### POST /api/presupuesto

Cabecera obligatoria: `Content-Type: application/json`. Los cuatro campos son obligatorios:

| Campo | Tipo | Valores válidos |
|---|---|---|
| `tipo` | texto | `"landing"` o `"corporativa"` |
| `paginas` | número entero | de 1 a 20 |
| `formulario` | booleano | `true` o `false` |
| `segundoIdioma` | booleano | `true` o `false` |

Solicitud:

```json
{ "tipo": "corporativa", "paginas": 4, "formulario": true, "segundoIdioma": false }
```

Respuesta (200):

```json
{ "base": 600, "paginasAdicionales": 150, "formulario": 80, "segundoIdioma": 0, "total": 830, "moneda": "EUR" }
```

Errores (no se calcula el presupuesto):

| Estado | Cuándo |
|---|---|
| 400 | JSON mal formado, el cuerpo no es un objeto, falta un campo o un campo no cumple su tipo/rango |
| 415 | La cabecera `Content-Type` no es `application/json` |

Las respuestas de error tienen la forma `{"errores": ["mensaje", ...]}`, por ejemplo:

```json
{ "errores": ["\"paginas\" debe ser un número entero entre 1 y 20."] }
```

Las propiedades adicionales se ignoran: enviar `"total": 1` o `"precio": 0` no cambia el resultado.

### Probar desde la terminal

Abrir la URL en el navegador no sirve para el POST (no envía JSON). Usar un cliente HTTP o la terminal.

**macOS / Linux (curl):**

```bash
curl http://localhost:3000/api/estado
curl http://localhost:3000/api/tarifas
curl -X POST http://localhost:3000/api/presupuesto \
  -H "Content-Type: application/json" \
  -d '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

**Windows (PowerShell):**

```powershell
Invoke-RestMethod http://localhost:3000/api/estado
Invoke-RestMethod http://localhost:3000/api/tarifas
Invoke-RestMethod http://localhost:3000/api/presupuesto -Method Post `
  -ContentType "application/json" `
  -Body '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

## Tarifas

| Concepto | Precio |
|---|---|
| Landing, incluida la primera página | 300 € |
| Web corporativa, incluida la primera página | 600 € |
| Cada página adicional a la primera | 50 € |
| Formulario de contacto | 80 € |
| Segundo idioma | 150 € |

Sin impuestos, descuentos ni conceptos adicionales.

## Pruebas

Con el servidor en marcha, en otra terminal:

```
npm run pruebas
```

El script [scripts/pruebas.mjs](scripts/pruebas.mjs) comprueba las tres rutas y los nueve casos obligatorios. Si el servidor usa otro puerto: `npm run pruebas -- http://localhost:4000`.

Resultados obtenidos (en los casos inválidos se parte de la solicitud del caso 2 y solo cambia el campo probado):

| Caso | Solicitud | Esperado | Obtenido |
|---|---|---|---|
| — | `GET /api/estado` | 200 · `{"status":"ok"}` | 200 · `{"status":"ok"}` ✅ |
| — | `GET /api/tarifas` | 200 · tarifas | 200 · tarifas ✅ |
| 1 | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200 · 300 € | 200 · 300 € ✅ |
| 2 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200 · 830 € | 200 · 830 € ✅ |
| 3 | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | 200 · 580 € | 200 · 580 € ✅ |
| 4 | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | 200 · 1.250 € | 200 · 1.250 € ✅ |
| 5 | `{"tipo":"corporativa","paginas":0,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ |
| 6 | `{"tipo":"corporativa","paginas":21,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ |
| 7 | `{"tipo":"corporativa","paginas":2.5,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ |
| 8 | `{"tipo":"tienda","paginas":4,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ |
| 9 | `{"tipo":"corporativa","paginas":4,"formulario":"false","segundoIdioma":false}` | 400 | 400 ✅ |

Las respuestas completas de cada caso están en [PRUEBAS.md](PRUEBAS.md).

## Cómo está organizado el código

```
lib/presupuesto.ts                  Tarifas, validación y cálculo (sin dependencias de Next.js)
app/api/estado/route.ts             GET /api/estado
app/api/tarifas/route.ts            GET /api/tarifas
app/api/presupuesto/route.ts        POST /api/presupuesto
app/page.tsx                        Página de la interfaz
components/calculadora-presupuesto.tsx  Formulario de la interfaz (llama a la API)
scripts/pruebas.mjs                 Pruebas automáticas de las tres rutas
PRUEBAS.md                          Casos de prueba con sus respuestas completas
package.json / package-lock.json    Dependencias y scripts (necesarios para npm install)
```

### lib/presupuesto.ts

- **`TARIFAS`**: única fuente de precios. La usan tanto `/api/tarifas` como el cálculo, así que lo publicado y lo cobrado siempre coinciden.
- **`validarDatos(entrada)`**: recibe el cuerpo tal cual llega (`unknown`) y comprueba, en orden:
  1. Que es un objeto (no `null` ni un array).
  2. Que están los cuatro campos obligatorios.
  3. `tipo` es `"landing"` o `"corporativa"`.
  4. `paginas` es un número entero entre 1 y 20 (`typeof` rechaza la cadena `"4"`, `Number.isInteger` rechaza `2.5`).
  5. `formulario` y `segundoIdioma` son booleanos (`typeof` rechaza la cadena `"false"`).

  Devuelve los errores encontrados o un objeto nuevo con **solo** los cuatro campos. Así las propiedades adicionales (`total`, `precio`, `tarifas`...) se descartan y nunca llegan al cálculo.
- **`calcularPresupuesto(datos)`**: función independiente de la ruta que recibe datos ya validados y aplica `total = base + páginas adicionales + extras`, usando solo `TARIFAS`.

### app/api/presupuesto/route.ts

El manejador solo coordina los pasos: comprueba la cabecera → lee el JSON → valida → calcula → responde. Si algún paso falla, responde con el error y no calcula nada.

Los presupuestos no se guardan en ninguna base de datos.

### Ejemplo: cómo se calcula el caso 2

Solicitud: `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}`

1. **Validación:** es un objeto con los cuatro campos; `"corporativa"` es un tipo válido; `4` es un entero entre 1 y 20; `true` y `false` son booleanos. Pasa.
2. **Cálculo** con `TARIFAS`:
   - `base` = tarifa de `corporativa` = **600 €** (incluye la primera página).
   - `paginasAdicionales` = (4 − 1) × 50 = **150 €**.
   - `formulario` = está marcado → **80 €**.
   - `segundoIdioma` = no está marcado → **0 €**.
   - `total` = 600 + 150 + 80 + 0 = **830 €**.

### Ejemplo: cómo se rechaza `"formulario": "false"` (caso 9)

`"false"` entre comillas es una cadena de texto, no un booleano. La comprobación `typeof formulario !== "boolean"` es verdadera, así que se añade el error `"formulario" debe ser un booleano: true o false.`, la ruta responde **400** y `calcularPresupuesto` no llega a ejecutarse.

## Interfaz

La página principal (`http://localhost:3000`) es un formulario que usa la API: lee las tarifas de `GET /api/tarifas`, muestra el estado de `GET /api/estado` y envía la solicitud a `POST /api/presupuesto`. No calcula nada por su cuenta: el desglose y los errores que muestra son los que devuelve el servidor.

Usa componentes de cristal de [glasscn](https://glasscn-components.vercel.app/) (en `components/ui/glasscn/`, registrados como `@glasscn` en `components.json`).
