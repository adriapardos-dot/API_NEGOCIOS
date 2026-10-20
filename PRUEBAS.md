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
