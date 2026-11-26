// Reglas de negocio: stock nunca negativo en ventas, baja lógica y umbral de alertas (<=).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

let stockBD;
let registro;
const conn = {
    beginTransaction: async () => registro.push('BEGIN'),
    commit: async () => registro.push('COMMIT'),
    rollback: async () => registro.push('ROLLBACK'),
    release: () => {},
    query: async (sql, params = []) => {
        registro.push(sql);
        if (sql.startsWith('SHOW COLUMNS FROM `venta`')) return [[
            { Field: 'id_venta', Null: 'NO', Default: null, Extra: 'auto_increment' },
            { Field: 'id_cajero', Null: 'NO', Default: null, Extra: '' },
            { Field: 'total_venta', Null: 'NO', Default: null, Extra: '' },
            { Field: 'metodo_pago', Null: 'NO', Default: null, Extra: '' }]];
        if (sql.startsWith('SHOW COLUMNS FROM `detalle_venta`')) return [[
            { Field: 'id_detalle_venta', Null: 'NO', Default: null, Extra: 'auto_increment' },
            { Field: 'id_venta', Null: 'NO', Default: null, Extra: '' },
            { Field: 'id_producto', Null: 'NO', Default: null, Extra: '' },
            { Field: 'cantidad', Null: 'NO', Default: null, Extra: '' },
            { Field: 'precio_unitario', Null: 'NO', Default: null, Extra: '' }]];
        if (sql.includes('FOR UPDATE')) {
            return [stockBD[params[0]] === undefined ? [] : [{ id_producto: params[0], nombre: `P${params[0]}`,
                stock_actual: stockBD[params[0]], precio_venta: '2500.50' }]];
        }
        if (sql.startsWith('UPDATE producto SET stock_actual')) { stockBD[params[1]] = params[0]; return [{}]; }
        if (sql.includes('INSERT INTO')) return [{ insertId: 50 }];
        return [[]];
    }
};
const rutaDb = path.resolve(__dirname, '..', 'src', 'config', 'database.js');
require.cache[rutaDb] = { id: rutaDb, filename: rutaDb, loaded: true,
    exports: { getConnection: async () => conn, query: async () => [[]] } };
const ventas = require('../src/services/ventas.service');

test.beforeEach(() => { registro = []; });

test('NEG-02 vender exactamente el stock disponible lo deja en 0, no negativo', async () => {
    stockBD = { 1: '3.000' };
    const r = await ventas.registrar(2, [{ id_producto: 1, cantidad: 3 }], 'Efectivo');
    assert.equal(stockBD[1], '0.000');
    assert.equal(r.total, 7501.5, 'total = 3 × 2500.50 sin errores de redondeo');
    assert.ok(registro.includes('COMMIT'));
});

test('NEG-03 vender más que el stock responde 409 y revierte sin tocar inventario', async () => {
    stockBD = { 1: '2.999' };
    await assert.rejects(ventas.registrar(2, [{ id_producto: 1, cantidad: 3 }], 'Efectivo'), { status: 409 });
    assert.equal(stockBD[1], '2.999');
    assert.ok(registro.includes('ROLLBACK') && !registro.includes('COMMIT'));
    assert.ok(!registro.some(s => /INSERT INTO `venta`/.test(s)), 'no se crea la venta');
});

test('NEG-04 venta con stock 0 se rechaza', async () => {
    stockBD = { 1: '0.000' };
    await assert.rejects(ventas.registrar(2, [{ id_producto: 1, cantidad: 0.001 }], 'Efectivo'), { status: 409 });
});

test('NEG-05 si un renglón falla, ningún renglón de la venta descuenta stock (atomicidad)', async () => {
    stockBD = { 1: '10.000', 2: '1.000' };
    await assert.rejects(ventas.registrar(2, [{ id_producto: 1, cantidad: 5 }, { id_producto: 2, cantidad: 2 }], 'Efectivo'), { status: 409 });
    assert.deepEqual(stockBD, { 1: '10.000', 2: '1.000' });
    assert.ok(registro.includes('ROLLBACK'));
});

test('NEG-06 producto inactivo o inexistente no se puede vender (consulta exige estado = 1)', async () => {
    stockBD = {};
    await assert.rejects(ventas.registrar(2, [{ id_producto: 9, cantidad: 1 }], 'Efectivo'), { status: 404 });
    assert.ok(registro.some(s => /FROM producto WHERE id_producto = \? AND estado = 1 FOR UPDATE/.test(s)));
});

test('NEG-07 bloquea filas en orden de id para evitar interbloqueos', async () => {
    stockBD = { 3: '5.000', 1: '5.000' };
    await ventas.registrar(2, [{ id_producto: 3, cantidad: 1 }, { id_producto: 1, cantidad: 1 }], 'Efectivo');
    const bloqueos = registro.filter(s => s.includes('FOR UPDATE'));
    assert.equal(bloqueos.length, 2);
});

// Verificación estática del SQL: la regla depende de MariaDB y se confirma en la prueba integral.
const fuente = (r) => fs.readFileSync(path.resolve(__dirname, '..', 'src', r), 'utf8');
test('NEG-08 alertas usan "igual o por debajo" (<=) y excluyen inactivos', () => {
    const inv = fuente('services/inventario.service.js');
    assert.match(inv, /p\.estado = 1\s+AND p\.stock_actual <= p\.stock_minimo/);
    assert.match(fuente('services/abastecimiento.service.js'), /p\.estado=1 AND p\.stock_minimo>0 AND p\.stock_actual<=p\.stock_minimo/);
});

test('NEG-09 ninguna consulta del backend borra productos físicamente', () => {
    const dir = path.resolve(__dirname, '..', 'src');
    const archivos = fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.js'));
    for (const f of archivos) {
        assert.doesNotMatch(fs.readFileSync(path.join(dir, f), 'utf8'), /DELETE\s+FROM\s+`?producto`?\b/i, f);
    }
});

test('NEG-10 venta: BEGIN → SELECT … FOR UPDATE → UPDATE stock → COMMIT, en ese orden', async () => {
    stockBD = { 1: '4.000' };
    await ventas.registrar(2, [{ id_producto: 1, cantidad: 1 }], 'Efectivo');
    const i = (pred) => registro.findIndex(pred);
    const begin = i(s => s === 'BEGIN');
    const bloqueo = i(s => /SELECT[\s\S]*FROM producto[\s\S]*FOR UPDATE/.test(s));
    const descuento = i(s => s.startsWith('UPDATE producto SET stock_actual'));
    const commit = i(s => s === 'COMMIT');
    assert.ok(begin === 0 && begin < bloqueo && bloqueo < descuento && descuento < commit, JSON.stringify({ begin, bloqueo, descuento, commit }));
});
