import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  RUTAS_PROVEEDOR, rutaOrdenPropia, estaConfirmada, estadoOrden,
  puedeConfirmarOrden, cargarPortal, detalleOrdenPropia, confirmarOrdenPropia,
} from '../src/services/portalProveedor.js'

const ordenPendiente = { id_orden: 12, estado: 'Pendiente', confirmada_proveedor: 0, total: '35000.00' }
const ordenConfirmada = { ...ordenPendiente, confirmada_proveedor: 1, fecha_confirmacion: '2026-11-23T12:00:00.000Z' }
const ordenRecibida = { ...ordenConfirmada, estado: 'Recibida' }

function apiSimulada(funcion) {
  const viejoFetch = globalThis.fetch
  const storage = globalThis.sessionStorage
  globalThis.sessionStorage = { getItem: clave => clave === 'peakperformers_sesion' ? JSON.stringify({ token: 'jwt-proveedor-pruebas' }) : null }
  globalThis.fetch = funcion
  return () => { globalThis.fetch = viejoFetch; globalThis.sessionStorage = storage }
}
const json = (datos, status = 200) => new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json' } })

test('contrato exacto del portal según backend 6b2e660', () => {
  assert.equal(RUTAS_PROVEEDOR.perfil, '/proveedor/mi-perfil')
  assert.equal(RUTAS_PROVEEDOR.ordenes, '/proveedor/mis-ordenes')
  assert.equal(rutaOrdenPropia(12), '/proveedor/mis-ordenes/12')
  for (const id of [0, -1, '01', '12/otro', 'abc', '1?x=1', 1.2, null]) {
    assert.throws(() => rutaOrdenPropia(id), /inválido/)
  }
})

test('distingue pendiente, confirmada por el proveedor y recibida físicamente', () => {
  assert.equal(estadoOrden(ordenPendiente).texto, 'Pendiente de confirmación')
  assert.equal(estadoOrden(ordenConfirmada).texto, 'Confirmada por el proveedor')
  assert.equal(estadoOrden(ordenRecibida).texto, 'Recibida por la ferretería')
  assert.equal(estadoOrden({ estado: 'Cancelada', confirmada_proveedor: 0 }).texto, 'Cancelada')
  assert.equal(estaConfirmada({ confirmada_proveedor: '1' }), true)
})

test('solo permite confirmar órdenes pendientes sin confirmación previa', () => {
  assert.equal(puedeConfirmarOrden(ordenPendiente), true)
  assert.equal(puedeConfirmarOrden(ordenConfirmada), false)
  assert.equal(puedeConfirmarOrden(ordenRecibida), false)
  assert.equal(puedeConfirmarOrden({ estado: 'Cancelada', confirmada_proveedor: 0 }), false)
})

test('carga perfil, órdenes y detalles reales; confirma por POST con Bearer', async () => {
  const llamadas = []
  let confirmado = false
  const restaura = apiSimulada(async (path, opciones) => {
    llamadas.push({ path, ...opciones })
    assert.equal(opciones.headers.Authorization, 'Bearer jwt-proveedor-pruebas')
    if (path === '/api/proveedor/mi-perfil') return json({ id_proveedor: 3, razon_social: 'Empresa de prueba', nit_rut: '900000000' })
    if (path === '/api/proveedor/mis-ordenes' && opciones.method === 'GET') return json([{ ...ordenPendiente, confirmada_proveedor: confirmado ? 1 : 0 }])
    if (path === '/api/proveedor/mis-ordenes/12' && opciones.method === 'GET') return json({ ...ordenPendiente, confirmada_proveedor: confirmado ? 1 : 0, detalles: [ { id_producto: 7, sku: 'X-1', producto: 'Herramienta', cantidad: 2, costo_unitario: 17500, subtotal: 35000 } ] })
    if (path === '/api/proveedor/mis-ordenes/12/confirmar' && opciones.method === 'POST') { confirmado = true; return json({ id_orden: 12, confirmada_proveedor: true, estado: 'Pendiente' }) }
    return json({ mensaje: 'Ruta no encontrada' }, 404)
  })
  try {
    const { perfil, ordenes } = await cargarPortal()
    assert.equal(perfil.razon_social, 'Empresa de prueba')
    assert.equal(ordenes.length, 1)
    const detalle = await detalleOrdenPropia(12)
    assert.equal(detalle.detalles[0].subtotal, 35000)
    const resultado = await confirmarOrdenPropia(12)
    assert.equal(resultado.confirmada_proveedor, true)
    const posteriores = await cargarPortal()
    assert.equal(estadoOrden(posteriores.ordenes[0]).texto, 'Confirmada por el proveedor')
    assert.equal(llamadas.filter(i => i.method === 'POST').length, 1)
    assert.equal(llamadas.some(i => /\/api\/compras|\/recibir|\/inventario/.test(i.path)), false)
    assert.equal(llamadas.find(i => i.method === 'POST').body, undefined)
  } finally { restaura() }
})

test('el frontend no puede leer órdenes de otras empresas si el backend devuelve 404', async () => {
  const restaura = apiSimulada(async () => json({ mensaje: 'Orden no encontrada' }, 404))
  try {
    await assert.rejects(detalleOrdenPropia(99), /Orden no encontrada/)
    await assert.rejects(confirmarOrdenPropia(99), /Orden no encontrada/)
  } finally { restaura() }
})

test('una confirmación rechazada no se presenta como éxito', async () => {
  const restaura = apiSimulada(async () => json({ mensaje: 'La orden ya no está pendiente' }, 409))
  try { await assert.rejects(confirmarOrdenPropia(12), /ya no está pendiente/) }
  finally { restaura() }
})

test('el componente respeta el portal seguro y no recibe mercancía', () => {
  const contenido = fs.readFileSync(path.resolve(import.meta.dirname, '../src/pages/PortalProveedor.jsx'), 'utf8')
  const servicio = fs.readFileSync(path.resolve(import.meta.dirname, '../src/services/portalProveedor.js'), 'utf8')
  assert.match(contenido, /Confirmar recepción de solicitud/)
  assert.match(contenido, /fecha_confirmacion/)
  assert.match(contenido, /detalle\.detalles/)
  assert.match(servicio, /api\(RUTAS_PROVEEDOR.perfil\)/)
  assert.doesNotMatch(contenido + servicio, /api\(['"]\/compras|\/compras\/|\/recibir|stock_actual\s*=/)
})

test('el menú mantiene al proveedor fuera de las opciones administrativas', () => {
  const permisos = fs.readFileSync(path.resolve(import.meta.dirname, '../src/services/permisos.js'), 'utf8')
  assert.match(permisos, /\[ROLES.PROVEEDOR\]: \['proveedor'\]/)
})
