import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { PresupuestoDetallado } from "../seleccion"

// Plantilla del PDF (react-pdf). Recibe el detalle ya calculado por el
// servidor; no hace ningún cálculo propio.

const C = {
  tinta: "#0f172a",
  suave: "#475569",
  tenue: "#94a3b8",
  linea: "#e2e8f0",
  fondo: "#f8fafc",
  acento: "#4f46e5",
  acentoSuave: "#eef2ff",
  aviso: "#b45309",
  avisoFondo: "#fffbeb",
}

const s = StyleSheet.create({
  pagina: {
    paddingTop: 44,
    paddingBottom: 70,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.tinta,
    lineHeight: 1.45,
  },
  franja: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: C.acento,
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 26,
  },
  marca: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.acento },
  marcaSub: { fontSize: 9, color: C.suave, marginTop: 2 },
  titulo: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    letterSpacing: 1,
    lineHeight: 1.1,
  },
  meta: { fontSize: 9, color: C.suave, textAlign: "right", marginTop: 6 },
  bloqueCliente: {
    backgroundColor: C.fondo,
    borderRadius: 6,
    padding: 14,
    marginBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  etiqueta: {
    fontSize: 8,
    color: C.tenue,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  clienteNombre: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  seccion: { marginBottom: 18 },
  seccionTitulo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.acento,
    paddingBottom: 5,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.linea,
  },
  parrafo: { color: C.tinta },
  servicio: { marginBottom: 9 },
  servicioNombre: { fontFamily: "Helvetica-Bold" },
  servicioDesc: { color: C.suave },
  servicioMotivo: { color: C.suave, fontStyle: "italic", marginTop: 1 },
  filaCabecera: {
    flexDirection: "row",
    backgroundColor: C.fondo,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  fila: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.linea,
  },
  colConcepto: { flex: 1 },
  colDetalle: { width: 150, color: C.suave },
  colImporte: { width: 80, textAlign: "right" },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.suave,
    textTransform: "uppercase",
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.acento,
    borderRadius: 6,
    color: "#ffffff",
  },
  totalTexto: { fontFamily: "Helvetica-Bold", fontSize: 11, lineHeight: 1 },
  totalImporte: { fontFamily: "Helvetica-Bold", fontSize: 16, lineHeight: 1 },
  notaImpuestos: {
    fontSize: 8,
    color: C.tenue,
    textAlign: "right",
    marginTop: 4,
  },
  aclaraciones: {
    backgroundColor: C.avisoFondo,
    borderLeftWidth: 3,
    borderLeftColor: C.aviso,
    padding: 10,
    borderRadius: 4,
  },
  vineta: { flexDirection: "row", marginBottom: 3 },
  punto: { width: 10, color: C.aviso },
  pieLinea: {
    position: "absolute",
    bottom: 42,
    left: 48,
    right: 48,
    height: 1,
    backgroundColor: C.linea,
  },
  pieTexto: {
    position: "absolute",
    bottom: 26,
    left: 48,
    right: 48,
    fontSize: 8,
    color: C.tenue,
  },
})

const euros = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    useGrouping: "always",
  }).format(n)

export function fechaLarga(iso: string) {
  const [a, m, d] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)))
}

export function DocumentoPresupuesto({
  detalle,
}: {
  detalle: PresupuestoDetallado
}) {
  return (
    <Document
      title={`Presupuesto ${detalle.referencia} · ${detalle.cliente}`}
      author="Presupuesta mi web"
      language="es"
    >
      <Page size="A4" style={s.pagina}>
        <View style={s.franja} fixed />
        <View style={s.pieLinea} fixed />
        <Text style={s.pieTexto} fixed>
          Presupuesta mi web · Presupuesto {detalle.referencia} · Los aspectos
          pendientes se valorarán aparte.
        </Text>

        <View style={s.cabecera}>
          <View>
            <Text style={s.marca}>Presupuesta mi web</Text>
            <Text style={s.marcaSub}>Diseño y desarrollo de páginas web</Text>
          </View>
          <View>
            <Text style={s.titulo}>PRESUPUESTO</Text>
            <Text style={s.meta}>Referencia {detalle.referencia}</Text>
          </View>
        </View>

        <View style={s.bloqueCliente}>
          <View>
            <Text style={s.etiqueta}>Cliente</Text>
            <Text style={s.clienteNombre}>{detalle.cliente}</Text>
          </View>
          <View>
            <Text style={[s.etiqueta, { textAlign: "right" }]}>Fecha</Text>
            <Text style={{ textAlign: "right" }}>
              {fechaLarga(detalle.fecha)}
            </Text>
          </View>
        </View>

        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>Resumen del proyecto</Text>
          <Text style={s.parrafo}>{detalle.resumen}</Text>
        </View>

        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>Servicios incluidos</Text>
          {detalle.servicios.map((servicio) => (
            <View key={servicio.id} style={s.servicio} wrap={false}>
              <Text style={s.servicioNombre}>
                {servicio.nombre}
                {servicio.id === "landing" || servicio.id === "corporativa"
                  ? ` · ${detalle.paginas} ${detalle.paginas === 1 ? "página" : "páginas"}`
                  : ""}
              </Text>
              <Text style={s.servicioDesc}>{servicio.descripcion}</Text>
              {servicio.justificacion ? (
                <Text style={s.servicioMotivo}>{servicio.justificacion}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={s.seccion} wrap={false}>
          <Text style={s.seccionTitulo}>Desglose de importes</Text>
          <View style={s.filaCabecera}>
            <Text style={[s.colConcepto, s.th]}>Concepto</Text>
            <Text style={[s.colDetalle, s.th]}>Detalle</Text>
            <Text style={[s.colImporte, s.th]}>Importe</Text>
          </View>
          {detalle.lineas.map((linea) => (
            <View key={linea.concepto} style={s.fila}>
              <Text style={s.colConcepto}>{linea.concepto}</Text>
              <Text style={s.colDetalle}>{linea.detalle}</Text>
              <Text style={s.colImporte}>{euros(linea.importe)}</Text>
            </View>
          ))}
          <View style={s.total}>
            <Text style={s.totalTexto}>TOTAL</Text>
            <Text style={s.totalImporte}>{euros(detalle.total)}</Text>
          </View>
          <Text style={s.notaImpuestos}>Importes sin impuestos.</Text>
        </View>

        {detalle.aclaraciones.length > 0 && (
          <View style={s.seccion}>
            <Text style={s.seccionTitulo} minPresenceAhead={40}>
              Aclaraciones y aspectos pendientes
            </Text>
            <View style={s.aclaraciones}>
              {detalle.aclaraciones.map((a, i) => (
                <View key={i} style={s.vineta} wrap={false}>
                  <Text style={s.punto}>•</Text>
                  <Text style={{ flex: 1 }}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
