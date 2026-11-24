import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  ROLES, nombreRol, esAdministrador, esCajero, esProveedor,
  paginaInicial, puedeAcceder, puedeVender, puedeGestionarProductos,
  puedeGestionarCategorias, puedeGestionarCompras, puedeEditarFichaTecnica,
} from '../src/services/permisos.js'

const admin = { id_usuario: 1, rol: 'Administrador' }
const cajero = { id_usuario: 2, rol: 'Cajero' }
const proveedor = { id_usuario: 3, rol: 'Proveedor' }
const legado = { id_rol: 3, rol: 'Bodega' }

test('reconoce solo los tres roles oficiales por nombre de JWT verificado', () => {
  assert.deepEqual(Object.values(ROLES), ['Administrador', 'Cajero', 'Proveedor'])
  assert.equal(nombreRol(admin), 'Administrador')
  assert.equal(nombreRol({ rol: ' cAjErO ' }), 'Cajero')
  assert.equal(nombreRol(proveedor), 'Proveedor')
  assert.equal(nombreRol(legado), null)
  assert.equal(nombreRol({ id_rol: 3 }), null)
  assert.equal(nombreRol({ rol: 'Auxiliar de Bodega' }), null)
})
test('Administrador: catálogo, movimientos, compras, reportes y ventas', () => {
  for (const ruta of ['panel', 'consulta', 'mostrador', 'catalogo', 'movimientos', 'orden', 'reabastecimiento', 'reportes']) {
    assert.equal(puedeAcceder(admin, ruta), true, ruta)
  }
  assert.equal(puedeAcceder(admin, 'proveedor'), false)
  assert.equal(esAdministrador(admin), true)
})
test('Cajero: gestiona productos y ventas, sin compras ni operaciones administrativas', () => {
  for (const ruta of ['panel', 'consulta', 'mostrador', 'catalogo']) assert.equal(puedeAcceder(cajero, ruta), true, ruta)
  for (const ruta of ['usuarios', 'movimientos', 'reabastecimiento', 'orden', 'reportes', 'proveedor']) {
    assert.equal(puedeAcceder(cajero, ruta), false, ruta)
  }
  assert.equal(puedeVender(cajero), true)
  assert.equal(esCajero(cajero), true)
  assert.equal(puedeGestionarProductos(cajero), true)
  assert.equal(puedeGestionarCategorias(cajero), false)
  assert.equal(puedeGestionarCompras(cajero), false)
  assert.equal(puedeEditarFichaTecnica(cajero), false)
})
test('Proveedor: solamente su portal privado; no tiene ventas ni datos administrativos', () => {
  assert.equal(esProveedor(proveedor), true)
  assert.equal(paginaInicial(proveedor), 'proveedor')
  assert.equal(puedeAcceder(proveedor, 'proveedor'), true)
  for (const ruta of ['panel', 'consulta', 'mostrador', 'orden', 'reabastecimiento', 'reportes', 'catalogo', 'usuarios']) {
    assert.equal(puedeAcceder(proveedor, ruta), false, ruta)
  }
  assert.equal(puedeVender(proveedor), false)
  assert.equal(paginaInicial(legado), 'sin-acceso')
})
test('el portal de Proveedor no usa el endpoint global de órdenes', () => {
  const src = fs.readFileSync(path.resolve(import.meta.dirname, '../src/pages/PortalProveedor.jsx'), 'utf8')
  assert.doesNotMatch(src, /api\(['"]\/compras/)
})
test('la pantalla de usuarios no intenta llamar /api/usuarios inexistente', () => {
  const src = fs.readFileSync(path.resolve(import.meta.dirname, '../src/pages/Usuarios.jsx'), 'utf8')
  assert.doesNotMatch(src, /api\(['"]\/usuarios/)
})
test('cajero consulta productos sin token y no recibe precios de costo', () => {
  for (const name of ['Mostrador', 'ConsultaProductos']) {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, `../src/pages/${name}.jsx`), 'utf8')
    assert.match(src, /publico: true/)
    assert.doesNotMatch(src, /\.costo|precio_costo/)
  }
})

test('permisos de producto no conceden acceso a abastecimiento ni confirmación de proveedores', () => {
  assert.equal(puedeGestionarProductos(admin), true)
  assert.equal(puedeGestionarCategorias(admin), true)
  assert.equal(puedeGestionarCompras(admin), true)
  assert.equal(puedeEditarFichaTecnica(admin), true)
  assert.equal(puedeGestionarProductos(proveedor), false)
  for (const ruta of ['reabastecimiento','orden','movimientos','reportes','usuarios']) {
    assert.equal(puedeAcceder(cajero, ruta), false)
    assert.equal(puedeAcceder(proveedor, ruta), false)
  }
})
test('el menú del Cajero incluye Gestión de productos y no habilita Compras', () => {
  const menu = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/AppLayout.jsx'), 'utf8')
  assert.match(menu, /titulo: 'Gestión de productos'.*permitir: puedeGestionarProductos/)
  assert.match(menu, /titulo: 'Compras y proveedores'.*permitir: esAdministrador/)
  assert.match(menu, /titulo: 'Mi espacio de proveedor'.*permitir: esProveedor/)
})
test('el formulario permite POST/PUT/DELETE productos pero reserva categorías al Administrador', () => {
  const catalogo = fs.readFileSync(path.resolve(import.meta.dirname, '../src/pages/Catalogo.jsx'), 'utf8')
  assert.match(catalogo, /method: editId \? 'PUT' : 'POST'/)
  assert.match(catalogo, /method: 'DELETE'/)
  assert.match(catalogo, /gestionaCategorias && <button/)
  assert.match(catalogo, /if \(!gestionaCategorias\)/)
  assert.match(catalogo, /soloLectura=\{!editaFicha\}/)
  assert.doesNotMatch(catalogo, /POST.*compras|POST.*abastecimiento/)
})
