// Pruebas de seguridad y reglas de negocio sobre la app Express real (rutas + middlewares + JWT reales).
// Solo la BD se sustituye por un doble en memoria; no se toca MariaDB.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRETO = 'secreto-de-prueba-qa-123456';
process.env.JWT_SECRET = SECRETO;

const HASH = bcrypt.hashSync('ClaveCorrecta1', 4);
const ROLES = { 1: 'Administrador', 2: 'Cajero', 3: 'Proveedor' };
const USUARIOS = {
    1: { id_usuario: 1, id_rol: 1, estado: 1 },
    2: { id_usuario: 2, id_rol: 2, estado: 1 },
    3: { id_usuario: 3, id_rol: 3, estado: 1 },
    4: { id_usuario: 4, id_rol: 1, estado: 0 } // Administrador desactivado
};
const consultas = [];
const PRODUCTO = { id_producto: 7, id_categoria: 1, sku: 'QA-7', nombre: 'Martillo', precio_costo: '9000.00',
    precio_venta: '18000.00', stock_actual: '5.000', stock_minimo: '5.000', ubicacion_bodega: 'P1-E2',
    estado: 1, nombre_categoria: 'Herramientas' };

const dbFalsa = {
    query: async (sql, params = []) => {
        consultas.push({ sql, params });
        if (sql.includes('FROM usuario WHERE id_usuario')) {
            const u = USUARIOS[params[0]];
            return [u ? [u] : []];
        }
        if (sql.includes('FROM rol WHERE')) return [[{ id_rol: params[0], nombre_rol: ROLES[params[0]] }]];
        if (sql.includes('FROM usuario WHERE correo')) {
            return [params[0] === 'admin@qa.test'
                ? [{ id_usuario: 1, correo: 'admin@qa.test', contrasena_hash: HASH, estado: 1 }] : []];
        }
        if (sql.startsWith('UPDATE producto SET estado = 0')) return [{ affectedRows: 1 }];
        if (sql.includes('INSERT INTO producto')) return [{ insertId: 99 }];
        if (sql.includes('FROM producto')) {
            if (/SELECT p\.\*|SELECT \* FROM producto/.test(sql)) return [[PRODUCTO]];
            const { precio_costo, ubicacion_bodega, ...publico } = PRODUCTO;
            return [[publico]];
        }
        return [[]];
    },
    getConnection: async () => { throw new Error('no se usa en esta suite'); }
};

// Inyecta el doble antes de cargar la app: todos los módulos comparten esta instancia.
const rutaDb = path.resolve(__dirname, '..', 'src', 'config', 'database.js');
require.cache[rutaDb] = { id: rutaDb, filename: rutaDb, loaded: true, exports: dbFalsa };
const app = require('../src/app');

let base;
let servidor;
test.before(async () => {
    servidor = app.listen(0);
    await new Promise(r => servidor.once('listening', r));
    base = `http://127.0.0.1:${servidor.address().port}/api`;
});
test.after(() => servidor.close());

const token = (sub, opciones = {}, secreto = SECRETO) =>
    jwt.sign({ sub: String(sub) }, secreto, { algorithm: 'HS256', issuer: 'controlstock', expiresIn: '1h', ...opciones });
const ADMIN = token(1), CAJERO = token(2), PROVEEDOR = token(3);

async function llamar(metodo, ruta, { tk, body, cabeceras = {} } = {}) {
    const r = await fetch(base + ruta, {
        method: metodo,
        headers: { 'content-type': 'application/json', ...(tk ? { authorization: `Bearer ${tk}` } : {}), ...cabeceras },
        body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    });
    const texto = await r.text();
    let json = null;
    try { json = JSON.parse(texto); } catch { /* respuesta no JSON */ }
    return { status: r.status, json, texto };
}

const PRODUCTO_VALIDO = { id_categoria: 1, sku: 'QA-SEG-1', nombre: 'Llave QA', precio_costo: 1000,
    precio_venta: 1500, stock_minimo: 2, unidad_medida: 'Unidad' };

// --- A01 Control de acceso: matriz de rutas por rol ---
const SOLO_ADMIN = [
    ['GET', '/proveedores'], ['POST', '/proveedores'], ['DELETE', '/proveedores/1'],
    ['GET', '/compras'], ['POST', '/compras'], ['POST', '/compras/1/recibir'],
    ['GET', '/abastecimiento/faltantes'], ['POST', '/abastecimiento/generar'],
    ['GET', '/reportes/dashboard'], ['GET', '/reportes/ventas-resumen'],
    ['GET', '/inventario/movimientos'], ['POST', '/inventario/movimientos'],
    ['POST', '/categorias'], ['PUT', '/categorias/1'], ['DELETE', '/categorias/1']
];

test('SEG-01 sin token: toda ruta privada responde 401', async () => {
    const privadas = [...SOLO_ADMIN, ['POST', '/productos'], ['PUT', '/productos/7'], ['DELETE', '/productos/7'],
        ['POST', '/ventas'], ['GET', '/ventas'], ['GET', '/proveedor/mis-ordenes'], ['GET', '/auth/me'],
        ['GET', '/inventario/stock-bajo']];
    for (const [m, r] of privadas) {
        assert.equal((await llamar(m, r, { body: m === 'GET' ? undefined : {} })).status, 401, `${m} ${r}`);
    }
});

test('SEG-02 escalada Cajero→Administrador: rutas administrativas responden 403', async () => {
    for (const [m, r] of SOLO_ADMIN) {
        assert.equal((await llamar(m, r, { tk: CAJERO, body: m === 'GET' ? undefined : {} })).status, 403, `${m} ${r}`);
    }
});

test('SEG-03 Proveedor no accede a rutas internas ni vende', async () => {
    const internas = [...SOLO_ADMIN, ['POST', '/productos'], ['DELETE', '/productos/7'], ['POST', '/ventas'],
        ['GET', '/ventas'], ['GET', '/inventario/stock-bajo'], ['GET', '/inventario/existencias']];
    for (const [m, r] of internas) {
        assert.equal((await llamar(m, r, { tk: PROVEEDOR, body: m === 'GET' ? undefined : {} })).status, 403, `${m} ${r}`);
    }
});

test('SEG-04 Administrador y Cajero no entran al portal del Proveedor', async () => {
    for (const tk of [ADMIN, CAJERO]) {
        assert.equal((await llamar('GET', '/proveedor/mis-ordenes', { tk })).status, 403);
        assert.equal((await llamar('POST', '/proveedor/mis-ordenes/1/confirmar', { tk })).status, 403);
    }
});

test('SEG-05 Administrador sí pasa el control de acceso (no hay falso 403)', async () => {
    assert.equal((await llamar('GET', '/auth/me', { tk: ADMIN })).json.rol, 'Administrador');
    assert.notEqual((await llamar('GET', '/proveedores', { tk: ADMIN })).status, 403);
});

// --- A07 / A02 Tokens y sesión ---
test('SEG-06 tokens manipulados, vencidos, sin firma o de otro emisor → 401', async () => {
    const [h, p] = ADMIN.split('.');
    const sinFirma = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' + p + '.';
    const cargaAlterada = Buffer.from(JSON.stringify({ sub: '1', iss: 'controlstock' })).toString('base64url');
    const malos = [
        token(1, {}, 'otro-secreto-cualquiera-12345'),
        token(1, { expiresIn: -10 }),
        token(1, { issuer: 'atacante' }),
        sinFirma,
        `${h}.${cargaAlterada}.${CAJERO.split('.')[2]}`,
        token('0'), token('abc'), 'abc'
    ];
    for (const t of malos) {
        const r = await llamar('GET', '/auth/me', { tk: t });
        assert.equal(r.status, 401, t.slice(0, 25));
        assert.ok(!/at |Error:|stack/.test(r.texto), 'no filtra la traza');
    }
});

test('SEG-07 usuario desactivado pierde acceso aunque su token siga vigente', async () => {
    assert.equal((await llamar('GET', '/auth/me', { tk: token(4) })).status, 401);
});

test('SEG-08 /auth/me no expone hash, correo ni datos sensibles', async () => {
    const r = await llamar('GET', '/auth/me', { tk: CAJERO });
    assert.deepEqual(Object.keys(r.json).sort(), ['id_usuario', 'rol']);
});

test('SEG-09 login: respuesta sin hash y mismo mensaje para cuenta inexistente o clave errada', async () => {
    const ok = await llamar('POST', '/auth/login', { body: { correo: 'admin@qa.test', contrasena: 'ClaveCorrecta1' } });
    assert.equal(ok.status, 200);
    assert.ok(!/contrasena_hash|\$2[aby]\$/.test(ok.texto), 'la respuesta no contiene el hash');
    assert.equal(jwt.verify(ok.json.token, SECRETO, { issuer: 'controlstock' }).sub, '1');
    const errada = await llamar('POST', '/auth/login', { body: { correo: 'admin@qa.test', contrasena: 'Mala' } });
    const inexistente = await llamar('POST', '/auth/login', { body: { correo: 'nadie@qa.test', contrasena: 'Mala' } });
    assert.equal(errada.status, 401);
    assert.deepEqual(inexistente, errada);
});

test('SEG-10 login con cuenta inexistente también ejecuta bcrypt (sin enumeración por tiempo)', async () => {
    const original = bcrypt.compare;
    let llamadas = 0;
    bcrypt.compare = async (...a) => { llamadas++; return original(...a); };
    try {
        await llamar('POST', '/auth/login', { body: { correo: 'nadie@qa.test', contrasena: 'Mala' } });
    } finally { bcrypt.compare = original; }
    assert.equal(llamadas, 1);
});

test('SEG-11 login rechaza tipos no texto (inyección NoSQL/objetos) con 400', async () => {
    for (const body of [{ correo: { $ne: '' }, contrasena: 'x' }, { correo: 'a@b.c', contrasena: ['x'] }, {}]) {
        assert.equal((await llamar('POST', '/auth/login', { body })).status, 400);
    }
});

// --- A03 Inyección ---
test('SEG-12 búsqueda: payloads de inyección SQL viajan como parámetros, nunca en el SQL', async () => {
    const payloads = ["' OR 1=1 --", "%' UNION SELECT contrasena_hash FROM usuario --", "1; DROP TABLE producto", '\\\'"`'];
    for (const q of payloads) {
        consultas.length = 0;
        const r = await llamar('GET', `/productos/buscar?q=${encodeURIComponent(q)}&especificacion=${encodeURIComponent(q)}`);
        assert.equal(r.status, 200);
        const c = consultas.find(x => x.sql.includes('LOCATE'));
        assert.ok(!c.sql.includes(q), 'el payload no se concatena al SQL');
        assert.ok(c.params.includes(q.trim()), 'el payload va como parámetro');
    }
});

test('SEG-13 búsqueda: parámetros duplicados o fuera de rango → 400, no 500', async () => {
    for (const qs of ['q=a&q=b', 'q=' + 'x'.repeat(101), 'q=%20%20', '']) {
        assert.equal((await llamar('GET', `/productos/buscar?${qs}`)).status, 400, qs);
    }
});

test('SEG-14 IDs no numéricos o con inyección en la ruta → 400', async () => {
    for (const id of ['1%20OR%201=1', 'abc', '-1', '0', '1.5']) {
        assert.equal((await llamar('DELETE', `/productos/${id}`, { tk: ADMIN })).status, 400, id);
    }
});

test('SEG-15 JSON mal formado o enorme → error JSON controlado, sin traza', async () => {
    const malo = await llamar('POST', '/productos', { tk: ADMIN, body: '{malformado' });
    assert.equal(malo.status, 400);
    assert.deepEqual(malo.json, { mensaje: 'JSON invalido' });
    const grande = await llamar('POST', '/productos', { tk: ADMIN, body: JSON.stringify({ x: 'a'.repeat(120000) }) });
    assert.equal(grande.status, 413);
    assert.ok(grande.json && !/at |stack/.test(grande.texto));
});

// --- A04 Validación de entradas en productos ---
test('SEG-16 producto: valores numéricos no válidos se rechazan (sin coerción silenciosa)', async () => {
    const casos = [
        { precio_costo: '' }, { precio_venta: true }, { precio_costo: [5] }, { id_categoria: true },
        { stock_minimo: '' }, { precio_venta: 'Infinity' }, { precio_costo: -1 }, { sku: { $gt: '' } }
    ];
    for (const cambio of casos) {
        const r = await llamar('POST', '/productos', { tk: ADMIN, body: { ...PRODUCTO_VALIDO, ...cambio } });
        assert.equal(r.status, 400, JSON.stringify(cambio));
    }
    assert.equal((await llamar('POST', '/productos', { tk: ADMIN, body: PRODUCTO_VALIDO })).status, 201);
    assert.equal((await llamar('POST', '/productos', { tk: ADMIN,
        body: { ...PRODUCTO_VALIDO, precio_costo: '1000', stock_minimo: '2.5' } })).status, 201, 'acepta texto numérico del formulario');
});

test('SEG-17 producto: el cliente no puede fijar stock ni estado al crear', async () => {
    consultas.length = 0;
    await llamar('POST', '/productos', { tk: CAJERO, body: { ...PRODUCTO_VALIDO, stock_actual: 999, estado: 0 } });
    const insert = consultas.find(c => c.sql.includes('INSERT INTO producto'));
    assert.match(insert.sql, /VALUES \(\?, \?, \?, \?, \?, \?, \?, 0, \?, \?, \?, 1\)/);
    assert.ok(!insert.params.includes(999));
});

// --- A01 Exposición de datos: catálogo público frente a interno ---
test('SEG-18 catálogo sin token no expone costo ni ubicación; con token interno sí', async () => {
    const publico = await llamar('GET', '/productos');
    assert.ok(!('precio_costo' in publico.json[0]) && !('ubicacion_bodega' in publico.json[0]));
    const proveedor = await llamar('GET', '/productos', { tk: PROVEEDOR });
    assert.ok(!('precio_costo' in proveedor.json[0]), 'el Proveedor recibe la vista pública');
    const admin = await llamar('GET', '/productos', { tk: ADMIN });
    assert.ok('precio_costo' in admin.json[0]);
});

// --- Regla de negocio: baja lógica ---
test('NEG-01 DELETE /productos/:id hace baja lógica (UPDATE estado=0), nunca DELETE físico', async () => {
    consultas.length = 0;
    const r = await llamar('DELETE', '/productos/7', { tk: CAJERO });
    assert.equal(r.status, 200);
    assert.ok(consultas.some(c => /^UPDATE producto SET estado = 0 WHERE id_producto = \? AND estado = 1/.test(c.sql)));
    assert.ok(!consultas.some(c => /DELETE\s+FROM/i.test(c.sql)));
});
