const db = require("../config/database");
const { milUnidades, subtotalCentavos, fallo } = require("../utils/validaciones");

const consultarVinculos = async () => {
    const [filas] = await db.query(`SELECT pp.*, p.nombre AS producto, pr.razon_social AS proveedor
        FROM producto_proveedor pp
        JOIN producto p ON p.id_producto=pp.id_producto
        JOIN proveedor pr ON pr.id_proveedor=pp.id_proveedor
        ORDER BY p.nombre, pp.es_principal DESC`);
    return filas;
};

const guardarVinculo = async (datos) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [productos] = await conn.query("SELECT id_producto FROM producto WHERE id_producto=? AND estado=1 FOR UPDATE", [datos.id_producto]);
        if (!productos.length) throw fallo("Producto activo no encontrado", 404);
        const [proveedores] = await conn.query("SELECT id_proveedor FROM proveedor WHERE id_proveedor=?", [datos.id_proveedor]);
        if (!proveedores.length) throw fallo("Proveedor no encontrado", 404);
        if (datos.es_principal) {
            await conn.query("UPDATE producto_proveedor SET es_principal=0 WHERE id_producto=?", [datos.id_producto]);
        }
        await conn.query(`INSERT INTO producto_proveedor
            (id_producto,id_proveedor,costo_referencia,es_principal) VALUES (?,?,?,?)
            ON DUPLICATE KEY UPDATE costo_referencia=VALUES(costo_referencia),
            es_principal=VALUES(es_principal)`, [datos.id_producto, datos.id_proveedor,
            datos.costo_referencia, Number(datos.es_principal)]);
        await conn.commit();
        return { ...datos, mensaje: "Vínculo producto-proveedor guardado" };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally { conn.release(); }
};

const consultarFaltantes = async (conn = db) => {
    const [filas] = await conn.query(`
        SELECT p.id_producto, p.sku, p.nombre, p.stock_actual, p.stock_minimo,
            p.precio_costo, pp.id_proveedor, pr.razon_social AS proveedor,
            COALESCE(pp.costo_referencia, p.precio_costo) AS costo_referencia,
            ROUND(GREATEST(p.stock_minimo * 2 - p.stock_actual, 0), 3) AS cantidad_sugerida
        FROM producto p
        LEFT JOIN producto_proveedor pp
          ON pp.id_producto=p.id_producto AND pp.id_proveedor=(
            SELECT pp2.id_proveedor FROM producto_proveedor pp2
            WHERE pp2.id_producto=p.id_producto
            ORDER BY pp2.es_principal DESC, pp2.id_proveedor ASC LIMIT 1)
        LEFT JOIN proveedor pr ON pr.id_proveedor=pp.id_proveedor
        WHERE p.estado=1 AND p.stock_minimo>0 AND p.stock_actual<=p.stock_minimo
        ORDER BY pp.id_proveedor, p.id_producto
    `);
    const grupos = new Map();
    const sinProveedor = [];
    for (const f of filas) {
        const cantidad = Number(f.cantidad_sugerida);
        const item = { id_producto: f.id_producto, sku: f.sku, nombre: f.nombre,
            stock_actual: Number(f.stock_actual), stock_minimo: Number(f.stock_minimo),
            cantidad_sugerida: cantidad, costo_referencia: Number(f.costo_referencia) };
        if (!f.id_proveedor) { sinProveedor.push(item); continue; }
        if (!grupos.has(f.id_proveedor)) grupos.set(f.id_proveedor, {
            id_proveedor: f.id_proveedor, proveedor: f.proveedor, productos: []
        });
        grupos.get(f.id_proveedor).productos.push(item);
    }
    return { grupos: [...grupos.values()], sin_proveedor: sinProveedor };
};

// Operación solicitada explícitamente por Administrador: genera una orden Pendiente por proveedor.
// Se bloquea cada proveedor para no crear dos órdenes pendientes simultáneas en peticiones concurrentes.
const generarOrdenes = async () => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        // Bloqueo consistente para serializar la creación.
        await conn.query("SELECT id_proveedor FROM proveedor ORDER BY id_proveedor FOR UPDATE");
        const propuestas = await consultarFaltantes(conn);
        const creadas = [], omitidos = [];
        for (const grupo of propuestas.grupos) {
            // Una orden existente con el mismo producto pendiente evita duplicar el pedido.
            const [pendientes] = await conn.query(`SELECT d.id_producto
                FROM detalle_orden_compra d JOIN orden_compra o ON o.id_orden=d.id_orden
                WHERE o.id_proveedor=? AND o.estado='Pendiente'`, [grupo.id_proveedor]);
            const existentes = new Set(pendientes.map(p => p.id_producto));
            const elegibles = grupo.productos.filter(p => {
                if (existentes.has(p.id_producto)) {
                    omitidos.push({ id_producto: p.id_producto, motivo: "Ya tiene orden pendiente" });
                    return false;
                }
                if (!Number.isFinite(p.costo_referencia) || p.costo_referencia < 0 ||
                    milUnidades(p.cantidad_sugerida) <= 0) {
                    omitidos.push({ id_producto: p.id_producto, motivo: "Costo o cantidad no válidos" });
                    return false;
                }
                return true;
            });
            // La tabla detalle_orden_compra permite múltiples productos, pero dividimos a 100 por orden.
            for (let i=0; i<elegibles.length; i+=100) {
                const bloque = elegibles.slice(i,i+100);
                const totalCent = bloque.reduce((s,p) => s + subtotalCentavos(p.cantidad_sugerida,p.costo_referencia), 0n);
                if (totalCent > 9999999999n) throw fallo("Total de orden de reabastecimiento excedido",409);
                const [resultado] = await conn.query(`INSERT INTO orden_compra
                    (id_proveedor,estado,total) VALUES (?,'Pendiente',?)`,
                    [grupo.id_proveedor,(Number(totalCent)/100).toFixed(2)]);
                for (const item of bloque) await conn.query(`INSERT INTO detalle_orden_compra
                    (id_orden,id_producto,cantidad,costo_unitario) VALUES (?,?,?,?)`,
                    [resultado.insertId,item.id_producto,item.cantidad_sugerida.toFixed(3),item.costo_referencia.toFixed(2)]);
                creadas.push({ id_orden: resultado.insertId, id_proveedor: grupo.id_proveedor,
                    productos: bloque.length, total: Number(totalCent)/100 });
            }
        }
        await conn.commit();
        return { ordenes_creadas: creadas, omitidos, sin_proveedor: propuestas.sin_proveedor };
    } catch (error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
};
module.exports = { consultarVinculos, guardarVinculo, consultarFaltantes, generarOrdenes };
