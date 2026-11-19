const db = require("../config/database");
const { milUnidades, subtotalCentavos, fallo } = require("../utils/validaciones");

// La BD del proyecto usa id_cajero y total_venta, confirmado en el diagnóstico
// del 18/11/2026. Se mantienen variantes para pruebas y otros entornos.
const ESQUEMA = {
    venta: {
        id: ["id_venta"], usuario: ["id_cajero", "id_usuario"],
        total: ["total", "total_venta", "valor_total"],
        fecha: ["fecha_hora", "fecha_venta", "fecha", "created_at"],
        pago: ["metodo_pago", "medio_pago", "forma_pago", "tipo_pago"],
        estado: ["estado"], cliente: ["documento_cliente", "cedula_cliente"]
    },
    detalle_venta: {
        id: ["id_detalle_venta", "id_detalle"], venta: ["id_venta"],
        producto: ["id_producto"], cantidad: ["cantidad", "cantidad_vendida"],
        precio: ["precio_unitario", "precio_venta", "valor_unitario"],
        subtotal: ["subtotal", "total_detalle"]
    }
};
let cacheEsquema = null;

const entreComillas = (nombre) => `\`${nombre.replace(/`/g, "``")}\``;
const elegir = (filas, opciones) => opciones.find(c => filas.some(f => f.Field === c));

const esquemaTabla = async (conn, tabla, grupos) => {
    const [campos] = await conn.query(`SHOW COLUMNS FROM ${entreComillas(tabla)}`);
    const columnas = Object.fromEntries(Object.entries(grupos).map(([nombre, variantes]) =>
        [nombre, elegir(campos, variantes)]));
    const requeridos = tabla === "venta" ? ["id", "usuario", "total"] :
        ["id", "venta", "producto", "cantidad", "precio"];
    if (requeridos.some(nombre => !columnas[nombre])) {
        throw fallo(`La tabla ${tabla} no tiene el esquema esperado. Ejecuta node scripts/diagnosticar-esquema.js`, 503);
    }
    // Fallar de forma explícita ante campos obligatorios desconocidos en vez de inventar valores.
    const conocidos = new Set(Object.values(columnas).filter(Boolean));
    const noSoportados = campos.filter(c =>
        (!conocidos.has(c.Field) || (tabla === "venta" && c.Field === columnas.estado)) &&
        c.Null === "NO" && c.Default === null &&
        !String(c.Extra || "").includes("auto_increment"));
    if (noSoportados.length) {
        throw fallo(`Campos obligatorios no reconocidos en ${tabla}: ${noSoportados.map(c => c.Field).join(", ")}. Consulta README_ENTREGA_JUEVES.md`, 503);
    }
    return columnas;
};

const esquema = async (conn) => {
    if (cacheEsquema) return cacheEsquema;
    const venta = await esquemaTabla(conn, "venta", ESQUEMA.venta);
    const detalle = await esquemaTabla(conn, "detalle_venta", ESQUEMA.detalle_venta);
    cacheEsquema = { venta, detalle };
    return cacheEsquema;
};

const insertar = async (conn, tabla, valores) => {
    const columnas = Object.keys(valores).map(entreComillas).join(", ");
    const placeholders = Object.keys(valores).map(() => "?").join(", ");
    return conn.query(`INSERT INTO ${entreComillas(tabla)} (${columnas}) VALUES (${placeholders})`, Object.values(valores));
};

const listar = async () => {
    const e = (await esquema(db)).venta;
    const fecha = e.fecha ? `${entreComillas(e.fecha)} AS fecha_hora` : "NULL AS fecha_hora";
    const pago = e.pago ? `${entreComillas(e.pago)} AS metodo_pago` : "NULL AS metodo_pago";
    const [filas] = await db.query(`SELECT ${entreComillas(e.id)} AS id_venta,
        ${entreComillas(e.usuario)} AS id_usuario, ${entreComillas(e.total)} AS total,
        ${fecha}, ${pago} FROM venta ORDER BY ${entreComillas(e.id)} DESC LIMIT 100`);
    return filas;
};

const buscar = async (id) => {
    const { venta: v, detalle: d } = await esquema(db);
    const [cabeceras] = await db.query(`SELECT * FROM venta WHERE ${entreComillas(v.id)} = ?`, [id]);
    if (!cabeceras.length) return null;
    const [detalles] = await db.query(`SELECT d.*, p.nombre AS producto FROM detalle_venta d
        JOIN producto p ON p.id_producto = d.${entreComillas(d.producto)}
        WHERE d.${entreComillas(d.venta)} = ?`, [id]);
    return { ...cabeceras[0], detalles };
};

const registrar = async (idUsuario, detalles, metodoPago, documentoCliente = null) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const e = await esquema(conn);
        const idOrdenados = [...detalles].sort((a, b) => a.id_producto - b.id_producto);
        const facturables = [];
        let totalCentavos = 0n;

        for (const detalle of idOrdenados) {
            const [productos] = await conn.query(`SELECT id_producto, nombre, stock_actual,
                precio_venta FROM producto WHERE id_producto = ? AND estado = 1 FOR UPDATE`,
            [detalle.id_producto]);
            if (!productos.length) throw fallo(`Producto activo no encontrado: ${detalle.id_producto}`, 404);
            const p = productos[0];
            const cantidadMil = milUnidades(detalle.cantidad);
            const stockMil = milUnidades(p.stock_actual);
            if (cantidadMil > stockMil) throw fallo(`Stock insuficiente para ${p.nombre}`, 409);
            const precio = Number(p.precio_venta);
            if (!Number.isFinite(precio) || precio < 0) throw fallo("Precio de venta inválido en BD", 409);
            const subtotal = subtotalCentavos(detalle.cantidad, precio);
            totalCentavos += subtotal;
            facturables.push({ ...detalle, cantidadMil, stockMil, precio, subtotal });
        }
        if (totalCentavos > 9999999999n) throw fallo("La venta excede el máximo permitido", 400);

        const encabezado = {
            [e.venta.usuario]: idUsuario,
            [e.venta.total]: (Number(totalCentavos) / 100).toFixed(2)
        };
        if (e.venta.pago) encabezado[e.venta.pago] = metodoPago;
        if (e.venta.cliente && documentoCliente) encabezado[e.venta.cliente] = documentoCliente;
        if (e.venta.fecha) encabezado[e.venta.fecha] = new Date();
        const [resultado] = await insertar(conn, "venta", encabezado);

        for (const f of facturables) {
            const nuevo = (f.stockMil - f.cantidadMil) / 1000;
            await conn.query("UPDATE producto SET stock_actual = ? WHERE id_producto = ?",
                [nuevo.toFixed(3), f.id_producto]);
            const renglon = {
                [e.detalle.venta]: resultado.insertId,
                [e.detalle.producto]: f.id_producto,
                [e.detalle.cantidad]: (f.cantidadMil / 1000).toFixed(3),
                [e.detalle.precio]: f.precio.toFixed(2)
            };
            if (e.detalle.subtotal) renglon[e.detalle.subtotal] = (Number(f.subtotal) / 100).toFixed(2);
            await insertar(conn, "detalle_venta", renglon);
            await conn.query(`INSERT INTO movimiento_inventario
                (id_producto, id_usuario, tipo, cantidad, motivo) VALUES (?, ?, 'Salida', ?, ?)`,
                [f.id_producto, idUsuario, (f.cantidadMil / 1000).toFixed(3), `Venta #${resultado.insertId}`]);
        }
        await conn.commit();
        return { id_venta: resultado.insertId, total: Number(totalCentavos) / 100,
            productos_vendidos: facturables.length };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};
module.exports = { listar, buscar, registrar };
