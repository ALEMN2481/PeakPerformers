const db = require('../config/database');

const dashboard = async (_req, res) => {
    try {
        const [stock] = await db.query(`SELECT
            COUNT(*) AS productos_activos,
            COALESCE(SUM(stock_actual),0) AS unidades_disponibles,
            COALESCE(SUM(stock_actual*precio_costo),0) AS valor_costo_inventario,
            COALESCE(SUM(stock_actual*precio_venta),0) AS valor_venta_potencial,
            COALESCE(SUM(CASE WHEN stock_actual<=stock_minimo THEN 1 ELSE 0 END),0) AS productos_stock_bajo
            FROM producto WHERE estado=1`);
        const [proveedores] = await db.query('SELECT COUNT(*) AS total FROM proveedor');
        const [compras] = await db.query(`SELECT estado, COUNT(*) AS cantidad,
            COALESCE(SUM(total),0) AS total_valor FROM orden_compra GROUP BY estado`);
        const [movimientos] = await db.query(`SELECT tipo, COUNT(*) AS cantidad_movimientos,
            COALESCE(SUM(cantidad),0) AS unidades_movidas FROM movimiento_inventario
            WHERE fecha_hora >= NOW() - INTERVAL 30 DAY GROUP BY tipo`);
        const [ventas] = await db.query(`SELECT COUNT(*) AS cantidad,
            COALESCE(SUM(total_venta),0) AS ingresos,
            COALESCE(AVG(total_venta),0) AS ticket_promedio
            FROM venta WHERE fecha_hora >= NOW() - INTERVAL 30 DAY`);
        res.json({inventario:stock[0],proveedores:proveedores[0].total,
            ordenes_por_estado:compras,movimientos_ultimos_30_dias:movimientos,
            ventas_ultimos_30_dias:ventas[0]});
    } catch (e) {
        console.error('Dashboard:',e);
        res.status(500).json({mensaje:'Error al consultar indicadores'});
    }
};

const fechaValida = valor => {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const d = new Date(`${valor}T00:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === valor;
};

const ventasResumen = async (req,res) => {
    const desde = req.query.desde;
    const hasta = req.query.hasta;
    if ((desde && !fechaValida(desde)) || (hasta && !fechaValida(hasta)) ||
        (desde && hasta && desde > hasta)) {
        return res.status(400).json({mensaje:'Fecha inválida: usa desde/hasta=AAAA-MM-DD con desde <= hasta'});
    }
    // Por defecto se utiliza el mes natural en curso, en hora del servidor de BD.
    const fechaInicio = desde || new Date().toISOString().slice(0,7) + '-01';
    const fechaFin = hasta || new Date().toISOString().slice(0,10);
    try {
        const [total] = await db.query(`SELECT COUNT(*) AS cantidad_ventas,
            COALESCE(SUM(total_venta),0) AS total_ingresos,
            COALESCE(AVG(total_venta),0) AS ticket_promedio
            FROM venta WHERE fecha_hora>=? AND fecha_hora<DATE_ADD(?,INTERVAL 1 DAY)`,
        [fechaInicio,fechaFin]);
        const [porMetodo] = await db.query(`SELECT metodo_pago,COUNT(*) AS cantidad,
            COALESCE(SUM(total_venta),0) AS total
            FROM venta WHERE fecha_hora>=? AND fecha_hora<DATE_ADD(?,INTERVAL 1 DAY)
            GROUP BY metodo_pago ORDER BY total DESC`,[fechaInicio,fechaFin]);
        const [masVendidos] = await db.query(`SELECT p.id_producto,p.sku,p.nombre,
            COALESCE(SUM(d.cantidad),0) AS unidades_vendidas,
            COALESCE(SUM(d.cantidad*d.precio_unitario),0) AS importe
            FROM detalle_venta d JOIN venta v ON v.id_venta=d.id_venta
            JOIN producto p ON p.id_producto=d.id_producto
            WHERE v.fecha_hora>=? AND v.fecha_hora<DATE_ADD(?,INTERVAL 1 DAY)
            GROUP BY p.id_producto,p.sku,p.nombre
            ORDER BY unidades_vendidas DESC LIMIT 10`,[fechaInicio,fechaFin]);
        res.json({periodo:{desde:fechaInicio,hasta:fechaFin},resumen:total[0],
            por_metodo_pago:porMetodo,top_productos:masVendidos});
    } catch (err) {
        console.error('Reporte de ventas:',err);
        res.status(500).json({mensaje:'Error al consultar reporte de ventas'});
    }
};
module.exports = { dashboard, ventasResumen };
