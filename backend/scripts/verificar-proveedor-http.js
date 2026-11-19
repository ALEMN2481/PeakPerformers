// QA no destructiva: comprueba el aislamiento de la cuenta Proveedor.
const base = (process.env.CONTROLSTOCK_QA_URL || 'http://127.0.0.1:3000').replace(/\/$/, '') + '/api';
const correo = process.env.CONTROLSTOCK_PROVEEDOR_CORREO;
const password = process.env.CONTROLSTOCK_PROVEEDOR_PASSWORD;
function exigir(condicion, mensaje) { if (!condicion) throw Error(mensaje); }
async function peticion(ruta, token, method = 'GET', body) {
    const resp = await fetch(base + ruta, {
        method,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await resp.json().catch(() => ({}));
    return { status: resp.status, data };
}
(async () => {
    exigir(correo && password, 'Faltan correo y clave Proveedor en variables de entorno');
    const sesion = await peticion('/auth/login', null, 'POST', { correo, contrasena: password });
    exigir(sesion.status === 200 && sesion.data.token, `Login: HTTP ${sesion.status}`);
    const token = sesion.data.token;
    const me = await peticion('/auth/me', token);
    exigir(me.status === 200 && me.data.rol?.toLowerCase() === 'proveedor', 'Rol no es Proveedor');
    console.log('OK: autenticación de Proveedor');
    const perfil = await peticion('/proveedor/mi-perfil', token);
    exigir(perfil.status === 200 && Number(perfil.data.id_proveedor) > 0, 'Perfil sin empresa asociada');
    console.log('OK: perfil de empresa vinculada');
    const ordenes = await peticion('/proveedor/mis-ordenes', token);
    exigir(ordenes.status === 200 && Array.isArray(ordenes.data), 'No se listan sus órdenes');
    exigir(ordenes.data.every(o => Number(o.id_proveedor) === Number(perfil.data.id_proveedor)), 'Se filtró una orden de otra empresa');
    console.log('OK: órdenes filtradas; cantidad:', ordenes.data.length);
    if (ordenes.data.length) {
        const detalle = await peticion(`/proveedor/mis-ordenes/${ordenes.data[0].id_orden}`, token);
        exigir(detalle.status === 200 && Array.isArray(detalle.data.detalles), 'Detalle de orden propia inaccesible');
        console.log('OK: detalle de su orden');
    }
    const desconocida = await peticion('/proveedor/mis-ordenes/999999999', token);
    exigir(desconocida.status === 404, 'Consulta de orden ajena o inexistente no devuelve 404');
    console.log('OK: orden no asignada -> 404');
    for (const ruta of ['/compras', '/proveedores', '/ventas', '/abastecimiento/faltantes',
        '/inventario/existencias', '/reportes/dashboard']) {
        const r = await peticion(ruta, token);
        exigir(r.status === 403, `Acceso indebido ${ruta}: HTTP ${r.status}`);
        console.log(`OK: acceso bloqueado ${ruta}`);
    }
    const producto = await peticion('/productos', token);
    exigir(producto.status === 200 && Array.isArray(producto.data) &&
        producto.data.every(p => !Object.hasOwn(p, 'precio_costo')), 'Se expone precio_costo');
    console.log('OK: catálogo sin precio de costo');
    const resumen = await peticion('/inventario/resumen', token);
    exigir(resumen.status === 200 && !Object.hasOwn(resumen.data, 'valor_inventario'), 'Se expone valor de costo de inventario');
    console.log('OK: resumen de inventario sin costos');
    const escritura = await peticion('/productos', token, 'POST', {});
    exigir(escritura.status === 403, `Proveedor pudo crear productos: HTTP ${escritura.status}`);
    console.log('OK: Proveedor no puede crear productos');
    console.log('\nPRUEBA DE PROVEEDOR APROBADA');
})().catch(e => { console.error('PRUEBA DE PROVEEDOR FALLÓ:', e.message); process.exitCode=1; });
