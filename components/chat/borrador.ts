// Comunicación entre el chat (en el layout) y el asistente de presupuestos
// (en la página principal): el chat deja la descripción y el asistente la recoge.

export const CLAVE_BORRADOR = "presupuesta:borrador"
export const EVENTO_BORRADOR = "presupuesta:borrador"

export function guardarBorrador(texto: string) {
  try {
    sessionStorage.setItem(CLAVE_BORRADOR, texto)
  } catch {
    // Sin sessionStorage (modo privado estricto): el evento basta si ya estamos en "/".
  }
  window.dispatchEvent(new CustomEvent(EVENTO_BORRADOR))
}

export function recogerBorrador(): string | null {
  try {
    const texto = sessionStorage.getItem(CLAVE_BORRADOR)
    if (texto) sessionStorage.removeItem(CLAVE_BORRADOR)
    return texto
  } catch {
    return null
  }
}
