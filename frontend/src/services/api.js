/* Único punto de comunicación con el backend Express.
   En desarrollo Vite envía /api a http://localhost:3000 (vite.config.js). */
const BASE = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '')
const SESSION_KEY = 'controlstock_sesion'
const USER_KEY = 'controlstock_usuario_recordado'

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') }
  catch { return null }
}
export function rememberUser(value) { if (value) localStorage.setItem(USER_KEY, value); else localStorage.removeItem(USER_KEY) }
export const lastUser = () => localStorage.getItem(USER_KEY) || ''
export function saveSession(session) {
  localStorage.removeItem(SESSION_KEY) // limpieza de posibles sesiones guardadas por versiones anteriores
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('controlstock:session'))
}
export function logout() {
  sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('controlstock:session'))
}
export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status }
}
export async function api(path, { method = 'GET', body, signal, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getSession()?.token
  if (auth && token) headers.Authorization = `Bearer ${token}`
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal,
      credentials: 'same-origin',
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('No se pudo conectar con la API. Comprueba que el backend esté ejecutándose en el puerto 3000.')
  }
  const raw = await response.text()
  let payload
  try { payload = raw ? JSON.parse(raw) : null } catch { payload = null }
  if (!response.ok) {
    if (response.status === 401 && auth) logout()
    const message = payload?.mensaje || payload?.message || payload?.error || payload?.detalle
      || (response.status === 404 ? `El backend todavía no implementa ${method} ${path}.` : `Error del servidor (${response.status}).`)
    throw new ApiError(typeof message === 'string' ? message : 'No se pudo completar la solicitud.', response.status)
  }
  return payload
}
export function listado(response, keys = []) {
  if (Array.isArray(response)) return response
  for (const item of [response, response?.data, response?.resultado]) {
    if (Array.isArray(item)) return item
    if (item && typeof item === 'object') {
      for (const key of [...keys, 'items', 'resultados', 'registros', 'rows', 'data']) {
        if (Array.isArray(item[key])) return item[key]
      }
    }
  }
  if (response === null || response === undefined) return []
  throw new ApiError('La API respondió, pero el formato de datos no es una lista reconocible.')
}
export function normalizarCategoria(c) {
  return { id: c.id_categoria ?? c.id, nombre: c.nombre_categoria ?? c.nombre ?? '', descripcion: c.descripcion ?? '' }
}
export function normalizarProducto(p) {
  return {
    id: p.id_producto ?? p.id, sku: p.sku ?? '', nombre: p.nombre ?? p.nombre_producto ?? '',
    id_categoria: p.id_categoria ?? p.categoria?.id_categoria ?? p.categoria?.id ?? null,
    categoria: p.nombre_categoria ?? p.categoria?.nombre_categoria ?? p.categoria?.nombre ?? p.categoria ?? '',
    ub: p.ubicacion_bodega ?? p.ubicacion ?? '', unidad: p.unidad_medida ?? p.unidad ?? 'Unidad',
    stock: Number(p.stock_actual ?? p.stock ?? 0), minimo: Number(p.stock_minimo ?? p.minimo ?? 0),
    precio: Number(p.precio_venta ?? p.precio ?? 0), costo: Number(p.precio_costo ?? p.costo ?? 0),
    codigo_barras: p.codigo_barras ?? '', descripcion: p.descripcion ?? '',
    activo: ![0, false, '0', 'Inactivo', 'inactivo'].includes(p.estado ?? p.activo ?? 1),
  }
}
export const endpoints = {
  categorias: '/categorias', productos: '/productos', usuarios: '/usuarios',
  proveedores: '/proveedores', movimientos: '/movimientos', ventas: '/ventas',
  ordenes: '/ordenes-compra',
}
export function exportCsv(filename, headers, rows) {
  const esc = value => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(esc).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  URL.revokeObjectURL(url)
}
