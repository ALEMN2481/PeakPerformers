// Prueba el script de integración contra un servidor HTTP simulado, sin MariaDB.
// NO demuestra que MariaDB real funcione; sí detecta fallos de contrato en la prueba.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

function servidorFake({ errorCategoria = false } = {}) {
    const productos = new Map();
    const ventas = new Map();
    const ordenes = new Map();
    const specs = new Map();
    const vinculados = new Map();
    let categoriaId = 5, proveedorId = 11, idProd = 80, idOrden = 150, idVenta = 300;
    return http.createServer(async (req,res) => {
        let datos = {};
        try {
            let cuerpo=''; for await (const fragmento of req) cuerpo+=fragmento;
            if (cuerpo) datos=JSON.parse(cuerpo);
        } catch { res.writeHead(400).end('JSON invalido'); return; }
        const ruta = new URL(req.url,'http://localhost');
        const u = ruta.pathname;
        const auth = req.headers.authorization || '';
        const t = auth.slice(7);
        const admin = t.startsWith('admin-token');
        const cajero = t.startsWith('cajero-token');
        const enviar=(code,json)=>{res.writeHead(code,{'Content-Type':'application/json'}); res.end(JSON.stringify(json));};
        const ok=(j={})=>enviar(200,j), creado=(j={})=>enviar(201,j), fallo=(code,mensaje)=>enviar(code,{mensaje});
        if (u === '/api/estado') return ok({version:'entrega-2026-11-19'});
        if (u === '/api/test-db') return ok({mensaje:'Conexion con MariaDB exitosa'});
        if (u === '/api/auth/login' && req.method==='POST') {
            if (datos.correo==='administrador.test@controlstock.invalid' && datos.contrasena==='secret-admin') return ok({token:'admin-token-xxxxxxxxxxxxxxxxxxxx'});
            if (datos.correo==='cajero.test@controlstock.invalid' && datos.contrasena==='secret-cajero') return ok({token:'cajero-token-xxxxxxxxxxxxxxxxxxx'});
            return fallo(401,'Credenciales invalidas');
        }
        const token = t.startsWith('admin-token') ? 'admin' : t.startsWith('cajero-token') ? 'cajero' : null;
        if (u === '/api/auth/me') return token ? ok({rol:token==='admin'?'Administrador':'Cajero',id_usuario:token==='admin'?2:3}) : fallo(401,'Sin token');
        if (u === '/api/productos/99999999' && req.method==='DELETE') return fallo(401,'Sin token');
        if (u === '/api/reportes/dashboard') return token ? ok({inventario:{},ordenes_por_estado:[],ventas_ultimos_30_dias:{}}) : fallo(401,'Sin token');
        if (u === '/api/productos' && req.method==='GET') return ok([...productos.values()].map(p=>({id_producto:p.id_producto,nombre:p.nombre,stock_actual:p.stock_actual})));
        if (u === '/api/inventario/resumen') return ok({total_productos:productos.size});
        if (u === '/api/abastecimiento/vinculos' && req.method==='GET') return ok([]);
        if (u === '/api/abastecimiento/vinculos' && req.method==='POST') {vinculados.set(datos.id_producto,datos.id_proveedor);return ok({mensaje:'Vinculo guardado'});}
        if (u.match(/^\/api\/productos\/\d+\/especificaciones$/)) {
            const i=Number(u.split('/')[3]);
            if(req.method==='PUT') {specs.set(i,datos.especificaciones);return ok({cantidad:datos.especificaciones.length});}
            return ok(specs.get(i)||[]);
        }
        if (u === '/api/categorias' && req.method==='POST') return creado({id_categoria:errorCategoria?null:categoriaId++});
        if (u === '/api/proveedores' && req.method==='POST') return admin ? creado({id_proveedor:proveedorId++}) : fallo(403,'Prohibido');
        if (u === '/api/productos' && req.method==='POST') {
            if (!admin && !cajero) return fallo(403,'Prohibido');
            const p={...datos,id_producto:++idProd,stock_actual:0}; productos.set(p.id_producto,p);return creado({id_producto:p.id_producto});
        }
        if (u.match(/^\/api\/productos\/\d+$/)) {
            const i=Number(u.split('/')[3]);const p=productos.get(i);
            if (req.method === 'PUT') {
                if (!admin && !cajero) return fallo(403,'Prohibido');
                if (!p) return fallo(404,'No existe');
                Object.assign(p,datos);return ok({mensaje:'Producto actualizado'});
            }
            if (req.method === 'DELETE') {
                if (!admin && !cajero) return fallo(403,'Prohibido');
                if (!p) return fallo(404,'No existe');
                productos.delete(i);return ok({mensaje:'Producto desactivado'});
            }
            return p ? ok(p) : fallo(404,'No existe');
        }
        if (u === '/api/abastecimiento/generar' && req.method==='POST' && cajero) return fallo(403,'Prohibido');
        if(u==='/api/compras' && req.method==='POST') {
            if (!admin) return fallo(403,'Prohibido');
            const o={id_orden:++idOrden,estado:'Pendiente',detalles:datos.detalles};ordenes.set(o.id_orden,o);return creado({id_orden:o.id_orden});
        }
        if(u.match(/^\/api\/compras\/\d+\/recibir$/)){
            const o=ordenes.get(Number(u.split('/')[3]));
            if(o.estado!=='Pendiente')return fallo(409,'Ya recibida');
            for(const d of o.detalles) productos.get(d.id_producto).stock_actual+=d.cantidad;
            o.estado='Recibida';return ok({estado:o.estado});
        }
        if(u==='/api/ventas' && req.method==='POST'){
            const d=datos.detalles[0],p=productos.get(d.id_producto);
            if(p.stock_actual<d.cantidad)return fallo(409,'Stock insuficiente');
            p.stock_actual-=d.cantidad;
            const v={id_venta:++idVenta,id_cajero:token==='admin'?2:3,documento_cliente:datos.documento_cliente||null,
                total:d.cantidad*p.precio_venta,detalles:datos.detalles};ventas.set(v.id_venta,v);
            return creado({id_venta:v.id_venta,total:v.total});
        }
        if(u.match(/^\/api\/ventas\/\d+$/))return ok(ventas.get(Number(u.split('/')[3])));
        if(u==='/api/productos/buscar')return ok([...productos.values()].filter(p=>p.sku.includes(ruta.searchParams.get('q')||'')));
        if(u==='/api/inventario/existencias'||u==='/api/inventario/movimientos')return ok([]);
        if(u==='/api/abastecimiento/faltantes'){
            return ok({grupos:[{id_proveedor:11,productos:[...productos.values()].filter(p=>vinculados.has(p.id_producto)&&p.stock_actual<=p.stock_minimo)}]});
        }
        if(u==='/api/abastecimiento/generar' && req.method==='POST') {
            const faltantes=[...productos.values()].filter(p=>vinculados.has(p.id_producto)&&p.stock_actual<=p.stock_minimo);
            if(faltantes.length && !ordenes.has(777)){ordenes.set(777,{id_orden:777});return ok({ordenes_creadas:[{id_orden:777,id_proveedor:11}]});}
            return ok({ordenes_creadas:[]});
        }
        return fallo(404,`Ruta simulada no reconocida: ${req.method} ${u}`);
    });
}
async function correr(errorCategoria = false) {
    const s=servidorFake({errorCategoria});
    await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
    const port=s.address().port;
    try {
        const child=spawn(process.execPath,[path.join(__dirname,'prueba-integral.js')],{
            env:{...process.env,CONTROLSTOCK_QA_URL:`http://127.0.0.1:${port}`,
                CONTROLSTOCK_ADMIN_PASSWORD:'secret-admin',CONTROLSTOCK_CAJERO_PASSWORD:'secret-cajero'},
            stdio:['ignore','pipe','pipe']
        });
        let output=''; for(const stream of [child.stdout,child.stderr]) stream.on('data',d=>output+=d.toString());
        const exit=await new Promise(resolve=>child.on('close',resolve));
        return {exit,output};
    } finally { await new Promise(done=>s.close(done)); }
}
test('script QA: escenario integral simulado con compras, ventas y cajero',async()=>{
    const r=await correr();
    assert.equal(r.exit,0,r.output);
    assert.match(r.output,/PRUEBA INTEGRAL APROBADA/);
});
test('script QA: una categoría sin ID detiene la prueba con mensaje explicativo',async()=>{
    const r=await correr(true);
    assert.equal(r.exit,1,r.output);
    assert.match(r.output,/id_categoria numérico válido/);
    assert.doesNotMatch(r.output,/Registrar categoría, proveedor y producto QA\.\.\. OK/);
});
