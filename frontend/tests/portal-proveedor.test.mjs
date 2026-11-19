import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { rutaPortal, configuracionPortal } from '../src/services/portalProveedor.js'

const testCfg = {
  VITE_PROVEEDOR_PERFIL_RUTA: '/portal/perfil',
  VITE_PROVEEDOR_ORDENES_RUTA: '/portal/ordenes',
  VITE_PROVEEDOR_DETALLE_RUTA: '/portal/ordenes/:id',
  VITE_PROVEEDOR_CONFIRMAR_RUTA: '/portal/ordenes/:id/confirmar',
  VITE_PROVEEDOR_CONFIRMAR_METODO: 'POST',
}
test('el portal permanece deshabilitado cuando las rutas no están verificadas', () => {
  assert.equal(configuracionPortal({}).listo, false)
  assert.equal(configuracionPortal({ VITE_PROVEEDOR_ORDENES_RUTA: '/compras' }).listo, false)
})
test('no acepta URL externas, rutas globales ni rutas con parámetros sin validar', () => {
  for (const ruta of ['https://externo.test/ordenes', '//externo.test', '/compras', '/ventas', '/reportes/dashboard', '/inventario/movimientos', '/portal/../compras', '/portal/{otro}']) {
    assert.equal(rutaPortal(ruta, 4), null, ruta)
  }
  assert.equal(rutaPortal('/portal/:id', 'abc'), null)
})
test('arma rutas por orden propia usando ID entero positivo', () => {
  const cfg = configuracionPortal(testCfg)
  assert.equal(cfg.listo, true)
  assert.equal(rutaPortal(cfg.detallePlantilla, 12), '/portal/ordenes/12')
  assert.equal(rutaPortal(cfg.confirmarPlantilla, 12), '/portal/ordenes/12/confirmar')
  assert.equal(cfg.metodoConfirmar, 'POST')
})
test('la confirmación del portal no simula recepción de mercancía', () => {
  const archivo = fs.readFileSync(path.resolve(import.meta.dirname, '../src/pages/PortalProveedor.jsx'), 'utf8')
  assert.doesNotMatch(archivo, /api\(['"]\/compras/)
  assert.doesNotMatch(archivo, /\/recibir/)
  assert.match(archivo, /confirmarOrdenPropia/)
})
test('buscador de productos usa rutas públicas documentadas del backend', () => {
  const archivo = fs.readFileSync(path.resolve(import.meta.dirname, '../src/pages/ConsultaProductos.jsx'), 'utf8')
  assert.match(archivo, /\/productos\/buscar\?/)
  assert.match(archivo, /\/alternativas/)
  assert.doesNotMatch(archivo, /precio_costo|\.costo/)
})
