import { api, listado } from './api.js'

// Las rutas de acceso del proveedor se configuran ÚNICAMENTE a partir de
// backend/src/routes del commit que implementa el portal (no incluido en el ZIP
// de backend del 19/11 suministrado aquí). No se consulta /compras global.
const variables = () => (import.meta.env || {})

const RUTAS_GLOBALES = /^\/(?:compras|ventas|reportes|abastecimiento|usuarios|inventario)(?:\/|\?|$)/i

export function rutaPortal(ruta, id) {
  if (!ruta || typeof ruta !== 'string') return null
  let valor = ruta.trim()
  if (!valor) return null
  // Permitir configuraciones que incluyan /api sin duplicar el prefijo del cliente.
  if (valor.startsWith('/api/')) valor = valor.slice(4)
  // La ruta DEBE ser relativa a la API propia y nunca una URL externa.
  if (valor.startsWith('//') || !/^\/[a-z0-9_/:{}.-]+$/i.test(valor) || valor.includes('..') || RUTAS_GLOBALES.test(valor)) return null
  if (valor.includes(':id') || valor.includes('{id}')) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return null
    valor = valor.replaceAll(':id', String(Number(id))).replaceAll('{id}', String(Number(id)))
  }
  // Nunca permitir una ruta con parámetros pendientes por accidente.
  return /[:{}]/.test(valor) ? null : valor
}

export function configuracionPortal(env = variables()) {
  const perfil = rutaPortal(env.VITE_PROVEEDOR_PERFIL_RUTA)
  const ordenes = rutaPortal(env.VITE_PROVEEDOR_ORDENES_RUTA)
  const detallePlantilla = env.VITE_PROVEEDOR_DETALLE_RUTA || ''
  const confirmarPlantilla = env.VITE_PROVEEDOR_CONFIRMAR_RUTA || ''
  const metodo = String(env.VITE_PROVEEDOR_CONFIRMAR_METODO || '').toUpperCase()
  return {
    perfil,
    ordenes,
    detallePlantilla: /:id|\{id\}/.test(detallePlantilla) && rutaPortal(detallePlantilla, 1) ? detallePlantilla : null,
    confirmarPlantilla: /:id|\{id\}/.test(confirmarPlantilla) && rutaPortal(confirmarPlantilla, 1) && ['POST', 'PUT', 'PATCH'].includes(metodo) ? confirmarPlantilla : null,
    metodoConfirmar: ['POST', 'PUT', 'PATCH'].includes(metodo) ? metodo : null,
    listo: Boolean(perfil && ordenes),
  }
}

function contenido(respuesta) { return respuesta?.data ?? respuesta?.resultado ?? respuesta }

export async function cargarPortal(config = configuracionPortal()) {
  if (!config.listo) throw new Error('Falta configurar las rutas verificadas del portal de Proveedor.')
  const [perfil, ordenes] = await Promise.all([api(config.perfil), api(config.ordenes)])
  return { perfil: contenido(perfil), ordenes: listado(ordenes, ['ordenes', 'compras']) }
}

export async function detalleOrdenPropia(config, id) {
  const ruta = rutaPortal(config.detallePlantilla, id)
  if (!ruta) throw new Error('No existe una ruta de detalle de órdenes propias configurada.')
  return contenido(await api(ruta))
}

export async function confirmarOrdenPropia(config, id) {
  const ruta = rutaPortal(config.confirmarPlantilla, id)
  if (!ruta || !config.metodoConfirmar) throw new Error('No existe una ruta de confirmación segura configurada.')
  return api(ruta, { method: config.metodoConfirmar })
}
