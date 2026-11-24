import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
const src = path.resolve(import.meta.dirname, '../src')
const read = file => fs.readFileSync(path.join(src, file), 'utf8')

test('login verifica JWT en /auth/me antes de guardar sesión', () => {
  const codigo = read('pages/Login.jsx')
  assert.match(codigo, /api\('\/auth\/login'/)
  assert.match(codigo, /api\('\/auth\/me', \{ token \}\)/)
  assert.ok(codigo.indexOf("api('/auth/me'") < codigo.indexOf('saveSession('))
})
test('las operaciones de inventario y compras coinciden con rutas actuales', () => {
  const movimientos = read('pages/Movimientos.jsx')
  const orden = read('pages/Orden.jsx')
  assert.match(movimientos, /api\('\/inventario\/movimientos'/)
  assert.match(orden, /api\('\/compras'/)
  assert.match(orden, /\/compras\/\$\{creada\.id_orden\}\/recibir/)
})
test('ventas no suministra precio ni identidad de cajero', () => {
  const venta = read('pages/Mostrador.jsx')
  assert.match(venta, /detalles: lineas\.map\(l => \(\{ id_producto: l\.id, cantidad: l\.cant \}\)\)/)
  assert.doesNotMatch(venta, /precio_unitario: l\.precio/)
  assert.doesNotMatch(venta, /id_cajero/)
})
test('catálogo da de baja lógica por DELETE y no cambia stock por PUT', () => {
  const codigo = read('pages/Catalogo.jsx')
  assert.match(codigo, /method: 'DELETE'/)
  assert.doesNotMatch(codigo, /stock_actual: Number\(form\.stock_actual\)/)
})

test('catálogo usa endpoints de productos; no añade ruta nueva inventada', () => {
  const codigo = read('pages/Catalogo.jsx')
  assert.match(codigo, /api\(editId \? `\/productos\/\$\{editId\}` : '\/productos'/)
  assert.match(codigo, /api\(`\/productos\/\$\{inactivar.id\}`/)
  assert.doesNotMatch(codigo, /\/productos\/crear|\/productos\/inactivar/)
})
