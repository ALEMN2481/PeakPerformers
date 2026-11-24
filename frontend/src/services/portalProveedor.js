import { api, listado } from './api.js'

// Contrato confirmado en backend commit 6b2e660 (feature/proveedores-compras).
// Todas las rutas son privadas y el backend toma la identidad del JWT.
// Nunca usar /compras ni enviar id_proveedor desde React.
export const RUTAS_PROVEEDOR = Object.freeze({
  perfil: '/proveedor/mi-perfil',
  ordenes: '/proveedor/mis-ordenes',
})

function idOrdenValido(id) {
  const numero = Number(id)
  if (!Number.isSafeInteger(numero) || numero <= 0 || String(id).trim() !== String(numero)) {
    throw new Error('Identificador de orden inválido.')
  }
  return numero
}

export function rutaOrdenPropia(id) {
  return `${RUTAS_PROVEEDOR.ordenes}/${idOrdenValido(id)}`
}

export function estaConfirmada(orden) {
  return [true, 1, '1'].includes(orden?.confirmada_proveedor)
}

export function estadoOrden(orden) {
  const estado = String(orden?.estado ?? '').trim()
  const clave = estado.toLowerCase()
  if (clave === 'recibida') return { texto: 'Recibida por la ferretería', tono: 'verde' }
  if (clave === 'pendiente' && estaConfirmada(orden)) return { texto: 'Confirmada por el proveedor', tono: 'azul' }
  if (clave === 'pendiente') return { texto: 'Pendiente de confirmación', tono: 'ambar' }
  return { texto: estado || 'Estado no disponible', tono: 'gris' }
}

export function puedeConfirmarOrden(orden) {
  return String(orden?.estado ?? '').trim().toLowerCase() === 'pendiente' && !estaConfirmada(orden)
}

export async function cargarPortal() {
  const [perfil, respuesta] = await Promise.all([
    api(RUTAS_PROVEEDOR.perfil),
    api(RUTAS_PROVEEDOR.ordenes),
  ])
  return { perfil, ordenes: listado(respuesta) }
}

export async function detalleOrdenPropia(id) {
  const respuesta = await api(rutaOrdenPropia(id))
  if (!respuesta || !Array.isArray(respuesta.detalles)) {
    throw new Error('La API no devolvió el detalle esperado de la orden.')
  }
  return respuesta
}

export async function confirmarOrdenPropia(id) {
  return api(`${rutaOrdenPropia(id)}/confirmar`, { method: 'POST' })
}
