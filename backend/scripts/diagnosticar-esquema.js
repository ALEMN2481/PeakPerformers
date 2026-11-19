// Solo lectura. Comprueba la estructura necesaria para las pruebas del jueves.
const db = require("../src/config/database");
(async () => {
    for (const tabla of ["categoria", "producto", "usuario", "rol", "proveedor",
        "orden_compra", "detalle_orden_compra", "venta", "detalle_venta", "movimiento_inventario",
        "producto_proveedor", "producto_especificacion"]) {
        try {
            const [filas] = await db.query(`SHOW COLUMNS FROM \`${tabla}\``);
            console.log(`\n=== ${tabla} ===`);
            console.table(filas.map(x => ({ campo:x.Field, tipo:x.Type, obligatorio:x.Null, predeterminado:x.Default, extra:x.Extra })));
        } catch (err) {
            console.log(`\n=== ${tabla}: ${err.code || err.message} ===`);
        }
    }
})().catch(err => { console.error("Error al diagnosticar:",err.message); process.exitCode=1; })
    .finally(() => db.end());
