# Pruebas de la API

Pruebas realizadas con el servidor en marcha (`npm run dev`, `http://localhost:3000`).

## Cómo ejecutarlas

Con el servidor arrancado, en otra terminal:

```
npm run pruebas
```

El script [scripts/pruebas.mjs](scripts/pruebas.mjs) envía todas las peticiones (las POST con `Content-Type: application/json`) y comprueba el estado HTTP y el total.

## Rutas GET

| Ruta | Estado | Respuesta obtenida |
|---|---|---|
| `GET /api/estado` | 200 | `{"status":"ok"}` |
| `GET /api/tarifas` | 200 | `{"moneda":"EUR","tarifas":{"landing":300,"corporativa":600,"paginaAdicional":50,"formulario":80,"segundoIdioma":150}}` |

## POST /api/presupuesto

En los casos inválidos se parte de la solicitud válida del caso 2 y solo se cambia el campo que se prueba, para comprobar cada error por separado.

| Caso | Solicitud | Esperado | Obtenido | Respuesta |
|---|---|---|---|---|
| 1 | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200 · 300 € | 200 · 300 € ✅ | `{"base":300,"paginasAdicionales":0,"formulario":0,"segundoIdioma":0,"total":300,"moneda":"EUR"}` |
| 2 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200 · 830 € | 200 · 830 € ✅ | `{"base":600,"paginasAdicionales":150,"formulario":80,"segundoIdioma":0,"total":830,"moneda":"EUR"}` |
| 3 | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | 200 · 580 € | 200 · 580 € ✅ | `{"base":300,"paginasAdicionales":50,"formulario":80,"segundoIdioma":150,"total":580,"moneda":"EUR"}` |
| 4 | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | 200 · 1.250 € | 200 · 1.250 € ✅ | `{"base":300,"paginasAdicionales":950,"formulario":0,"segundoIdioma":0,"total":1250,"moneda":"EUR"}` |
| 5 | `{"tipo":"corporativa","paginas":0,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ | `{"errores":["\"paginas\" debe ser un número entero entre 1 y 20."]}` |
| 6 | `{"tipo":"corporativa","paginas":21,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ | `{"errores":["\"paginas\" debe ser un número entero entre 1 y 20."]}` |
| 7 | `{"tipo":"corporativa","paginas":2.5,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ | `{"errores":["\"paginas\" debe ser un número entero entre 1 y 20."]}` |
| 8 | `{"tipo":"tienda","paginas":4,"formulario":true,"segundoIdioma":false}` | 400 | 400 ✅ | `{"errores":["\"tipo\" debe ser \"landing\" o \"corporativa\"."]}` |
| 9 | `{"tipo":"corporativa","paginas":4,"formulario":"false","segundoIdioma":false}` | 400 | 400 ✅ | `{"errores":["\"formulario\" debe ser un booleano: true o false."]}` |

## Probar a mano desde la terminal (PowerShell)

Abrir la URL en el navegador no sirve para el POST: no envía JSON. Desde PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/estado
Invoke-RestMethod http://localhost:3000/api/tarifas

Invoke-RestMethod http://localhost:3000/api/presupuesto -Method Post `
  -ContentType "application/json" `
  -Body '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

---

# Pruebas del asistente con IA y del PDF

Ejecutadas con `npm run pruebas:ia` contra la build de producción (`npm run build && npm start`) y el modelo `gpt-5.4-mini`. Todos los datos son ficticios. Las respuestas de la IA pueden variar en la redacción entre ejecuciones; lo que se comprueba es la estructura y los servicios.

| # | Situación | Entrada | Esperado | Obtenido |
|---|---|---|---|---|
| 1 | Solicitud clara | Restaurante: carta, galería, contacto, formulario de reservas, castellano e inglés (4 páginas) | `corporativa`, `formulario`, `segundoIdioma`; 4 páginas | ✅ `[corporativa, formulario, segundoIdioma]`, `paginas: 4`, sin dudas |
| 2 | Solicitud ambigua | «Quiero algo para internet para mi negocio, que quede bonito y moderno.» | Dudas para aclarar; páginas sin inventar | ✅ `paginas: null`, 2 dudas (tipo de negocio y secciones) |
| 3 | Servicio no ofrecido | Tienda online con pago con tarjeta, blog y SEO | Va a `fueraDeCatalogo`; solo ids del catálogo | ✅ `fueraDeCatalogo`: tienda online, pagos con tarjeta, blog, SEO |
| 4a | Descripción vacía | `"descripcion": "   "` | 400, sin llamar a OpenAI | ✅ 400 · «La descripción del proyecto no puede estar vacía.» |
| 4b | Descripción demasiado larga | 2001 caracteres | 400 | ✅ 400 · «La descripción no puede superar los 2000 caracteres (tiene 2001).» |
| 5 | Fallo de OpenAI (simulado) | cabecera `x-simular-fallo-ia: 1` | Error y opción de reintentar | ✅ 502 · `"reintentable": true` |
| 5b | Fallo de OpenAI (real) | servidor con `OPENAI_API_KEY` inválida | Error controlado, sin datos técnicos | ✅ 502 · «El asistente no está disponible (credenciales no válidas en el servidor). Puedes volver a intentarlo.» |
| 6a | Propuesta original | corporativa + formulario + segundo idioma, 4 páginas | 600 + 150 + 80 + 150 = **980 €** | ✅ 980 € |
| 6b | Modificación antes del PDF | se quita el segundo idioma, 5 páginas y se envía `"total": 1, "precio": 0` | 600 + 200 + 80 = **880 €** (ignora los importes enviados) | ✅ 880 € |
| 6c | PDF con la selección modificada | misma selección que 6b | PDF válido con 880 € | ✅ `application/pdf`, empieza por `%PDF` y muestra 880 € |
| 6d | Selección no válida | id `tiendaOnline`, sin tipo de web y `paginas: null` | 400 con los tres errores | ✅ 400 |

## Prueba en el navegador

Flujo completo con Chrome headless:

1. Se rellena el ejemplo «Restaurante» y se corta la red en `/api/propuesta`: aparece «No hemos podido preparar la propuesta» con el botón **Reintentar**.
2. Al reintentar llega la propuesta (corporativa, formulario y segundo idioma). Las páginas aparecen como **dato necesario** y el botón «Revisar documento» está desactivado.
3. Se indican 4 páginas y se quita el segundo idioma: el servidor recalcula **830 €** (600 + 3 × 50 + 80).
4. La vista previa muestra el documento y «Aceptar y descargar PDF» descarga el archivo.
