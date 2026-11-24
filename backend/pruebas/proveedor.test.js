const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function cargar(archivo, mocks = {}) {
    const ruta = path.join(__dirname, '..', 'src', archivo);
    const modulo = { exports: {} };
    const codigo = fs.readFileSync(ruta, 'utf8');
    const requerido = (nombre) => Object.hasOwn(mocks, nombre) ? mocks[nombre] : require(nombre);
    const fn = vm.runInNewContext(`(function(require,module,exports){ ${codigo}\n })`,
        { console, Number, String, Error, Set, Date, Array }, { filename: ruta });
    fn(requerido, modulo, modulo.exports);
    return modulo.exports;
}
const respuesta = () => ({ codigo: 200, cuerpo: null,
    status(n) { this.codigo = n; return this; },
    json(v) { this.cuerpo = v; return this; } });

test('Proveedor entra a su portal, Administrador y Cajero reciben 403', () => {
    const m = cargar('middlewares/auth.middleware.js', {
        jsonwebtoken: { verify: () => ({ sub: '7' }) },
        '../config/database': { query: async () => [[]] }
    });
    for (const rol of ['Administrador', 'Cajero']) {
        const res = respuesta();
        let entro = false;
        m.soloProveedor({ usuario: { rol } }, res, () => { entro = true; });
        assert.equal(entro, false);
        assert.equal(res.codigo, 403);
    }
    const res = respuesta();
    let entro = false;
    m.soloProveedor({ usuario: { rol: 'Proveedor' } }, res, () => { entro = true; });
    assert.equal(entro, true);
});

test('Proveedor no puede consultar recursos internos de la ferreteria', () => {
    const m = cargar('middlewares/auth.middleware.js', {
        jsonwebtoken: { verify: () => ({ sub: '7' }) },
        '../config/database': { query: async () => [[]] }
    });
    const res = respuesta();
    m.puedeConsultarInventario({ usuario: { rol: 'Proveedor' } }, res, () => assert.fail('No debe pasar'));
    assert.equal(res.codigo, 403);
    const res2 = respuesta();
    m.puedeVender({ usuario: { rol: 'Proveedor' } }, res2, () => assert.fail('No debe vender'));
    assert.equal(res2.codigo, 403);
});

test('Consulta de orden ajena devuelve null sin leer sus detalles', async () => {
    const consultas = [];
    const servicio = cargar('services/portal-proveedor.service.js', {
        '../config/database': {
            query: async (sql, valores) => {
                consultas.push({ sql, valores });
                return [[]];
            }
        }
    });
    assert.equal(await servicio.miOrden(15, 92), null);
    assert.equal(consultas.length, 1);
    assert.match(consultas[0].sql, /usuario_proveedor up/);
    assert.match(consultas[0].sql, /up\.id_usuario = \? AND o\.id_orden = \?/);
    assert.deepEqual(Array.from(consultas[0].valores), [15, 92]);
});

test('Listado de órdenes restringe la búsqueda al usuario autenticado', async () => {
    const consultas = [];
    const servicio = cargar('services/portal-proveedor.service.js', {
        '../config/database': { query: async (sql, valores) => {
            consultas.push({ sql, valores });
            return [[{ id_orden: 10, id_proveedor: 8 }]];
        } }
    });
    const lista = await servicio.misOrdenes(15);
    assert.equal(lista.length, 1);
    assert.match(consultas[0].sql, /JOIN orden_compra o ON o.id_proveedor = up.id_proveedor/);
    assert.match(consultas[0].sql, /WHERE up.id_usuario = \?/);
    assert.deepEqual(Array.from(consultas[0].valores), [15]);
});

function simulacionConfirmar(estado, pertenece) {
    const log = [];
    const conn = {
        beginTransaction: async () => log.push('BEGIN'),
        commit: async () => log.push('COMMIT'),
        rollback: async () => log.push('ROLLBACK'),
        release: () => log.push('RELEASE'),
        query: async (sql, valores) => {
            log.push({ sql, valores });
            if (sql.includes('FROM orden_compra o')) return [pertenece ? [{ id_orden: 5, estado }] : []];
            if (sql.includes('INSERT INTO confirmacion_proveedor')) return [{ affectedRows: 1 }];
            if (sql.includes('SELECT fecha_confirmacion')) return [[{ fecha_confirmacion: '2026-11-19 09:00:00' }]];
            throw Error('SQL no simulada');
        }
    };
    const servicio = cargar('services/portal-proveedor.service.js', {
        '../config/database': { getConnection: async () => conn }
    });
    return { servicio, log };
}

test('No confirma una orden de otra empresa y revierte', async () => {
    const { servicio, log } = simulacionConfirmar('Pendiente', false);
    await assert.rejects(() => servicio.confirmar(15, 5), e => e.status === 404);
    assert.ok(log.includes('ROLLBACK'));
    assert.ok(!log.some(x => x.sql?.includes('INSERT INTO confirmacion_proveedor')));
});

test('No confirma órdenes ya recibidas', async () => {
    const { servicio, log } = simulacionConfirmar('Recibida', true);
    await assert.rejects(() => servicio.confirmar(15, 5), e => e.status === 409);
    assert.ok(log.includes('ROLLBACK'));
});

test('Confirma una orden propia sin cambiar su estado ni el inventario', async () => {
    const { servicio, log } = simulacionConfirmar('Pendiente', true);
    const r = await servicio.confirmar(15, 5);
    assert.equal(r.confirmada_proveedor, true);
    assert.equal(r.estado, 'Pendiente');
    assert.ok(log.includes('COMMIT'));
    assert.ok(!log.some(x => /UPDATE producto|UPDATE orden_compra/.test(x.sql || '')));
    const busqueda = log.find(x => x.sql?.includes('FROM orden_compra o'));
    assert.deepEqual(Array.from(busqueda.valores), [15, 5]);
});
