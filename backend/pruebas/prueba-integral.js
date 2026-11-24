// Prueba integral con API real y BD local: CREA datos QA. No usar en produccion.
// Ingreso de credenciales mediante el lanzador PowerShell (no en argumentos de CLI).
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const base = (process.env.CONTROLSTOCK_QA_URL || 'http://localhost:3000').replace(/\/$/, '') + '/api';
const correo = process.env.CONTROLSTOCK_ADMIN_CORREO || 'administrador.test@controlstock.invalid';
const contrasena = process.env.CONTROLSTOCK_ADMIN_PASSWORD;
const correoCajero = process.env.CONTROLSTOCK_CAJERO_CORREO || 'cajero.test@controlstock.invalid';
const contrasenaCajero = process.env.CONTROLSTOCK_CAJERO_PASSWORD;
delete process.env.CONTROLSTOCK_ADMIN_PASSWORD;
delete process.env.CONTROLSTOCK_CAJERO_PASSWORD;

let tokenAdmin = null;
const resultados = { fecha: new Date().toISOString(), estado: 'en_proceso', pasos: [], ids: {} };
let pasoActual = 'inicio';
const fallo = (mensaje) => { throw new Error(mensaje); };
const asegurar = (condicion, mensaje) => { if (!condicion) fallo(mensaje); };
const id = (valor, nombre) => {
    asegurar(Number.isSafeInteger(valor) && valor > 0, `Respuesta sin ${nombre} numérico válido: ${JSON.stringify(valor)}`);
    return valor;
};
const array = (valor) => Array.isArray(valor) ? valor : (valor == null ? [] : [valor]);

async function pedir(ruta, { metodo = 'GET', token = null, datos = undefined, estado = 200 } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (datos !== undefined) headers['Content-Type'] = 'application/json';
    let respuesta;
    try {
        respuesta = await fetch(base + ruta, {
            method: metodo, headers, body: datos === undefined ? undefined : JSON.stringify(datos),
            signal: AbortSignal.timeout(12000)
        });
    } catch (e) { fallo(`No se pudo acceder a ${metodo} ${ruta}. ¿Está iniciado el backend? ${e.message}`); }
    const texto = await respuesta.text();
    let json;
    try { json = texto ? JSON.parse(texto) : null; } catch { json = { texto: texto.slice(0, 300) }; }
    if (respuesta.status !== estado) {
        fallo(`${metodo} ${ruta}: HTTP ${respuesta.status}, se esperaba ${estado}. ` +
            `${json?.mensaje || JSON.stringify(json).slice(0, 400)}`);
    }
    return json;
}

async function ejecutar(nombre, accion) {
    pasoActual = nombre;
    process.stdout.write(`  • ${nombre}... `);
    const res = await accion();
    resultados.pasos.push({ nombre, estado: 'OK' });
    console.log('OK');
    return res;
}

async function main() {
    if (!contrasena) fallo('No se recibió contraseña. Usa PROBAR_TODO.ps1, que la pide de forma privada.');
    console.log('\nPEAKPERFORMERS / CONTROLSTOCK - PRUEBA INTEGRAL');
    console.log('ADVERTENCIA: se crean categorias, productos, compras y ventas QA en la BD local.\n');
    await ejecutar('Backend correcto y MariaDB accesible', async () => {
        const version = await pedir('/estado');
        asegurar(version.version === 'entrega-2026-11-19', 'Backend de versión anterior. Cierra el proceso viejo y reinicia.');
        const db = await pedir('/test-db');
        asegurar(String(db.mensaje).includes('exitosa'), 'Sin conexión de MariaDB');
    });
    await ejecutar('Seguridad JWT y datos públicos', async () => {
        await pedir('/productos/99999999', { metodo:'DELETE', estado:401 });
        const publicos = await pedir('/productos');
        asegurar(array(publicos).every(p => !Object.hasOwn(p, 'precio_costo')), 'Se expone costo de compra sin autenticación');
        const resumen = await pedir('/inventario/resumen');
        asegurar(!Object.hasOwn(resumen,'valor_inventario'), 'Se expone valor de costo sin autenticación');
        await pedir('/reportes/dashboard', { estado:401 });
    });
    await ejecutar('Login y rol Administrador', async () => {
        const login = await pedir('/auth/login', { metodo:'POST', datos: {correo,contrasena}, estado:200 });
        asegurar(typeof login.token === 'string' && login.token.length > 20, 'No se devolvió token JWT');
        tokenAdmin = login.token;
        const perfil = await pedir('/auth/me', { token:tokenAdmin });
        asegurar(String(perfil.rol).toLowerCase() === 'administrador', 'La cuenta no tiene permisos de Administrador');
    });
    // Preflight: verificar dependencias de migración antes de CREAR cualquier dato de QA.
    await ejecutar('Migración de abastecimiento y especificaciones', async () => {
        const l = await pedir('/abastecimiento/vinculos', { token:tokenAdmin });
        asegurar(Array.isArray(l), 'Respuesta de vínculos inválida');
        const e = await pedir('/productos/99999999/especificaciones');
        asegurar(Array.isArray(e), 'Respuesta de especificaciones inválida');
    });
    const sufijo = Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
    const proveedor = await ejecutar('Registrar categoría, proveedor y producto QA', async () => {
        const cat = await pedir('/categorias', { metodo:'POST', token:tokenAdmin, estado:201,
            datos:{ nombre_categoria:`Categoria QA ${sufijo}`, descripcion:'Prueba automatizada local' }});
        const idCategoria = id(cat.id_categoria, 'id_categoria');
        resultados.ids.id_categoria = idCategoria;
        const prov = await pedir('/proveedores', { metodo:'POST', token:tokenAdmin, estado:201,
            datos:{ nit_rut:`QA-${sufijo}`, razon_social:`Proveedor QA ${sufijo}` }});
        const idProveedor = id(prov.id_proveedor, 'id_proveedor');
        resultados.ids.id_proveedor = idProveedor;
        const producto = await pedir('/productos', { metodo:'POST', token:tokenAdmin, estado:201,
            datos:{id_categoria:idCategoria,sku:`QA-${sufijo}`, nombre:`Martillo QA ${sufijo}`,
                precio_costo:5000,precio_venta:8000,stock_minimo:3,unidad_medida:'Unidad',
                descripcion:'Prueba del jueves',ubicacion_bodega:'QA-A1'} });
        const idProducto = id(producto.id_producto, 'id_producto');
        resultados.ids.id_producto = idProducto;
        const leido = await pedir(`/productos/${idProducto}`, { token:tokenAdmin });
        asegurar(Number(leido.id_categoria) === idCategoria, 'Producto creado en categoría incorrecta');
        return { idCategoria,idProveedor,idProducto };
    });
    await ejecutar('Orden de compra y recepción una sola vez', async () => {
        const orden = await pedir('/compras', { metodo:'POST', token:tokenAdmin, estado:201,
            datos:{id_proveedor:proveedor.idProveedor,
                detalles:[{ id_producto:proveedor.idProducto, cantidad:10, costo_unitario:5000 }] }});
        const idOrden = id(orden.id_orden, 'id_orden');
        resultados.ids.id_orden = idOrden;
        const recibo = await pedir(`/compras/${idOrden}/recibir`, { metodo:'POST', token:tokenAdmin, datos:{} });
        asegurar(recibo.estado === 'Recibida', 'Orden no pasó a Recibida');
        await pedir(`/compras/${idOrden}/recibir`, { metodo:'POST', token:tokenAdmin, datos:{}, estado:409 });
        const p = await pedir(`/productos/${proveedor.idProducto}`, {token:tokenAdmin});
        asegurar(Number(p.stock_actual) === 10, `Stock tras recepción es ${p.stock_actual}, no 10`);
    });
    await ejecutar('Venta real y control de stock insuficiente', async () => {
        const venta = await pedir('/ventas', { metodo:'POST', token:tokenAdmin, estado:201,
            datos:{metodo_pago:'Efectivo', documento_cliente:'QA-DEMO',
                detalles:[{id_producto:proveedor.idProducto, cantidad:2}]} });
        const idVenta = id(venta.id_venta, 'id_venta');
        resultados.ids.id_venta = idVenta;
        asegurar(Number(venta.total) === 16000, `Total de venta inesperado ${venta.total}`);
        const detalle = await pedir(`/ventas/${idVenta}`, {token:tokenAdmin});
        asegurar(Number(detalle.id_cajero) > 0, 'No se guardó id_cajero de la venta');
        asegurar(detalle.documento_cliente === 'QA-DEMO', 'No se guardó documento_cliente');
        await pedir('/ventas', { metodo:'POST', token:tokenAdmin, datos:{
            detalles:[{id_producto:proveedor.idProducto,cantidad:9999}]}, estado:409 });
        const p = await pedir(`/productos/${proveedor.idProducto}`, {token:tokenAdmin});
        asegurar(Number(p.stock_actual) === 8, `Stock debería ser 8; actual=${p.stock_actual}`);
    });
    await ejecutar('Búsqueda por SKU y consultas privadas', async () => {
        const p = await pedir(`/productos/buscar?q=${encodeURIComponent('QA-'+sufijo)}`);
        asegurar(array(p).some(x => Number(x.id_producto) === proveedor.idProducto),'Búsqueda no devolvió el producto QA');
        await pedir('/inventario/existencias', {token:tokenAdmin});
        await pedir('/inventario/movimientos', {token:tokenAdmin});
    });
    await ejecutar('Reabastecimiento sin órdenes duplicadas', async () => {
        const otro = await pedir('/productos', { metodo:'POST',token:tokenAdmin,estado:201,
            datos:{id_categoria:proveedor.idCategoria,sku:`QA-BAJO-${sufijo}`,nombre:`Producto faltante QA ${sufijo}`,
                precio_costo:100,precio_venta:200,stock_minimo:5,unidad_medida:'Unidad'} });
        const idBajo = id(otro.id_producto,'id_producto (faltante)');
        resultados.ids.id_producto_faltante = idBajo;
        await pedir('/abastecimiento/vinculos', { metodo:'POST',token:tokenAdmin,
            datos:{id_producto:idBajo,id_proveedor:proveedor.idProveedor,costo_referencia:100,es_principal:true} });
        const faltantes = await pedir('/abastecimiento/faltantes', {token:tokenAdmin});
        asegurar(array(faltantes.grupos).some(g => array(g.productos).some(p => Number(p.id_producto) === idBajo)),
            'El producto QA no aparece en faltantes');
        const generadas = await pedir('/abastecimiento/generar', {metodo:'POST',token:tokenAdmin,datos:{}});
        asegurar(array(generadas.ordenes_creadas).some(o => Number(o.id_proveedor) === proveedor.idProveedor),
            'No se creó la orden QA de reabastecimiento');
        const repeticion = await pedir('/abastecimiento/generar', {metodo:'POST',token:tokenAdmin,datos:{}});
        asegurar(!array(repeticion.ordenes_creadas).some(o => Number(o.id_proveedor) === proveedor.idProveedor),
            'Se duplicó una orden de reabastecimiento pendiente');
        await pedir(`/productos/${idBajo}/especificaciones`, {metodo:'PUT',token:tokenAdmin,
            datos:{especificaciones:[{atributo:'Material',valor:'Acero QA'}]} });
        const specs = await pedir(`/productos/${idBajo}/especificaciones`);
        asegurar(array(specs).some(x=>x.atributo==='Material' && x.valor==='Acero QA'),
            'No se guardaron las especificaciones técnicas');
    });
    await ejecutar('Dashboard de gerencia', async () => {
        const tablero = await pedir('/reportes/dashboard', { token:tokenAdmin });
        asegurar(tablero.inventario && tablero.ordenes_por_estado,'Dashboard sin datos completos');
    });
    if (contrasenaCajero) {
        await ejecutar('Cajero registra, edita, inactiva y vende; compras restringidas', async () => {
            const login = await pedir('/auth/login', { metodo:'POST',
                datos:{correo:correoCajero,contrasena:contrasenaCajero} });
            const t = login.token;
            const perfil = await pedir('/auth/me', {token:t});
            asegurar(String(perfil.rol).toLowerCase() === 'cajero', 'La cuenta adicional no es Cajero');
            // Creamos un producto propio de QA para no inactivar el que usa la venta.
            const datos = {id_categoria:proveedor.idCategoria, sku:`QA-CAJ-${sufijo}`,
                nombre:`Tornillo QA Cajero ${sufijo}`, precio_costo:200,
                precio_venta:350, stock_minimo:2, unidad_medida:'Unidad'};
            const alta = await pedir('/productos', {metodo:'POST', token:t, estado:201, datos});
            const idCajeroProducto = id(alta.id_producto,'id_producto de Cajero');
            resultados.ids.id_producto_cajero = idCajeroProducto;
            const actualizado = {...datos, nombre:`Tornillo Editado QA ${sufijo}`,precio_venta:400};
            await pedir(`/productos/${idCajeroProducto}`, {metodo:'PUT', token:t, datos:actualizado});
            const editado = await pedir(`/productos/${idCajeroProducto}`, {token:t});
            asegurar(editado.nombre === actualizado.nombre && Number(editado.precio_venta) === 400,
                'El Cajero no consiguió modificar el producto');
            await pedir(`/productos/${idCajeroProducto}`, {metodo:'DELETE',token:t});
            await pedir(`/productos/${idCajeroProducto}`, {token:t, estado:404});
            // No dar acceso al Cajero para solicitar proveedores ni recibir compras.
            await pedir('/compras', {metodo:'POST', token:t, datos:{}, estado:403});
            await pedir('/abastecimiento/generar', {metodo:'POST',token:t,datos:{}, estado:403});
            await pedir('/proveedores', {metodo:'POST',token:t,datos:{}, estado:403});
            const venta=await pedir('/ventas',{ metodo:'POST',token:t,estado:201,
                datos:{detalles:[{id_producto:proveedor.idProducto,cantidad:1}],metodo_pago:'Tarjeta'} });
            id(venta.id_venta,'id_venta de Cajero');
            const p=await pedir(`/productos/${proveedor.idProducto}`,{token:tokenAdmin});
            asegurar(Number(p.stock_actual) === 7, 'Venta del cajero no descontó exactamente una unidad');
        });
    } else console.log('  · Prueba de Cajero omitida: no se introdujo su contraseña (prueba unitaria sí incluida).');
    resultados.estado = 'APROBADO';
    console.log('\n✔ PRUEBA INTEGRAL APROBADA: inventario, compras, ventas, abastecimiento y seguridad.');
}

main().catch(e => {
    resultados.estado = 'FALLÓ';
    resultados.error = `${pasoActual}: ${e.message}`;
    console.error(`\n✖ FALLO en «${pasoActual}»: ${e.message}`);
    process.exitCode = 1;
}).finally(() => {
    try {
        const salida = path.join(os.tmpdir(), `ControlStock_QA_${Date.now()}.json`);
        fs.writeFileSync(salida, JSON.stringify(resultados,null,2),{mode:0o600});
        console.log(`Reporte técnico sin contraseñas: ${salida}`);
    } catch (e) { console.error('No se pudo guardar reporte:',e.message); }
});
