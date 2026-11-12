import test from 'node:test'
import assert from 'node:assert/strict'
import { api, listado, normalizarCategoria, normalizarProducto, ApiError } from '../src/services/api.js'

test('normaliza categorías de MariaDB', () => {
  assert.deepEqual(normalizarCategoria({ id_categoria: 1, nombre_categoria: 'Herramientas' }).nombre, 'Herramientas')
  assert.equal(listado({ categorias: [{ id_categoria: 2 }] }, ['categorias']).length, 1)
  assert.equal(listado({ data: { productos: [{ sku: 'ABC' }] } }, ['productos']).length, 1)
})
test('interpreta columnas de la tabla producto', () => {
  const p = normalizarProducto({ id_producto: 3, nombre: 'Martillo', stock_actual: '5.000', stock_minimo: '8.000', precio_venta: '7000.00', estado: 0 })
  assert.deepEqual([p.id, p.stock, p.minimo, p.precio, p.activo], [3, 5, 8, 7000, false])
})
test('llama la ruta API y decodifica JSON', async () => {
  const old = globalThis.fetch
  try {
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/categorias')
      assert.equal(options.method, 'GET')
      return new Response(JSON.stringify([{ id_categoria: 1 }]), { status: 200 })
    }
    assert.equal((await api('/categorias'))[0].id_categoria, 1)
  } finally { globalThis.fetch = old }
})
test('no presenta una petición fallida como exitosa', async () => {
  const old = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ mensaje: 'Sin permisos' }), { status: 403 })
    await assert.rejects(api('/usuarios', { method: 'POST', body: {} }), e => e instanceof ApiError && e.message === 'Sin permisos' && e.status === 403)
  } finally { globalThis.fetch = old }
})
test('informa cuando la API no existe o está desconectada', async () => {
  const old = globalThis.fetch
  try {
    globalThis.fetch = async () => { throw TypeError('Network failed') }
    await assert.rejects(api('/productos'), /No se pudo conectar con la API/)
    globalThis.fetch = async () => new Response('', { status: 404 })
    await assert.rejects(api('/productos'), /todavía no implementa/)
  } finally { globalThis.fetch = old }
})
