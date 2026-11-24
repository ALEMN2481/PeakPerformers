const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function importar(ruta, sustitutos) {
    const archivo = path.resolve(__dirname, '..', 'src', ruta);
    const codigo = fs.readFileSync(archivo, 'utf8');
    const modulo = { exports: {} };
    const requerido = nombre => Object.hasOwn(sustitutos, nombre)
        ? sustitutos[nombre] : require(nombre);
    const fn = vm.runInNewContext(`(function(require,module,exports){${codigo}\n})`,
        {console, Number, String, Error, Set, Date}, {filename: archivo});
    fn(requerido, modulo, modulo.exports);
    return modulo.exports;
}

function respuesta() {
    return {estado:200, cuerpo:null,
        status(n) {this.estado=n; return this;},
        json(d) {this.cuerpo=d; return this;}};
}

const permisos = importar('middlewares/auth.middleware.js', {
    jsonwebtoken: {verify:()=>({sub:'3'})},
    '../config/database': {query:async()=>[[]]}
});

function permite(middleware, rol) {
    const res=respuesta();
    let permitio=false;
    middleware({usuario:{rol}},res,()=>{permitio=true;});
    return {permitio,estado:res.estado};
}

test('Operaciones: Administrador y Cajero pueden gestionar productos', () => {
    for (const rol of ['Administrador', 'Cajero', 'cajero']) {
        assert.equal(permite(permisos.puedeGestionarProductos, rol).permitio, true);
    }
});

test('Operaciones: Proveedor, invitado y petición sin usuario no pueden editar', () => {
    for (const rol of ['Proveedor', 'Invitado', undefined]) {
        const r=permite(permisos.puedeGestionarProductos, rol);
        assert.equal(r.permitio,false);
        assert.equal(r.estado,403);
    }
});

test('Compras y proveedores comerciales siguen reservados al Administrador', () => {
    for (const rol of ['Cajero', 'Proveedor']) {
        assert.equal(permite(permisos.soloAdministrador,rol).estado,403);
    }
    assert.equal(permite(permisos.soloAdministrador,'Administrador').permitio,true);
});

test('Rutas de productos usan permiso de operaciones, no permiso administrativo', () => {
    const rutas=[];
    const router={};
    for (const metodo of ['get','put','post','delete']) {
        router[metodo]=(ruta,...handlers) => {rutas.push({metodo,ruta,handlers}); return router;};
    }
    const controlador = Object.fromEntries([
        'obtenerProductos','obtenerProducto','registrarProducto','modificarProducto','borrarProducto',
        'buscarProductos','alternativasProducto','consultar','reemplazar'
    ].map(n => [n,()=>{}]));
    importar('routes/productos.routes.js', {
        'express':{Router:()=>router},
        '../middlewares/auth.middleware':permisos,
        '../controllers/productos.controller':controlador,
        '../controllers/busqueda.controller':controlador,
        '../controllers/especificaciones.controller':controlador
    });
    for (const [metodo,ruta] of [
        ['post','/'], ['put','/:id'], ['delete','/:id'], ['put','/:id/especificaciones']
    ]) {
        const r=rutas.find(x=>x.metodo===metodo && x.ruta===ruta);
        assert.ok(r,`Falta ${metodo.toUpperCase()} ${ruta}`);
        assert.equal(r.handlers[0],permisos.autenticar,`Falta autenticar en ${ruta}`);
        assert.equal(r.handlers[1],permisos.puedeGestionarProductos,`Permiso incorrecto ${ruta}`);
        assert.equal(permite(r.handlers[1],'Cajero').permitio,true);
        assert.equal(permite(r.handlers[1],'Proveedor').estado,403);
    }
});

test('Rutas de órdenes de compra requieren Administrador', () => {
    const rutas=[];
    const router={
        use:(...h)=>{rutas.push({metodo:'use',handlers:h});return router;},
        get:(url,...h)=>{rutas.push({metodo:'get',url,handlers:h});return router;},
        post:(url,...h)=>{rutas.push({metodo:'post',url,handlers:h});return router;}
    };
    const controlador={listar(){},obtener(){},registrar(){},recibir(){}};
    importar('routes/compras.routes.js',{
        express:{Router:()=>router},
        '../middlewares/auth.middleware':permisos,
        '../controllers/compras.controller':controlador
    });
    const proteccion=rutas.find(x=>x.metodo==='use');
    assert.ok(proteccion,'Compras sin middleware general');
    assert.equal(proteccion.handlers[0],permisos.autenticar);
    assert.equal(proteccion.handlers[1],permisos.soloAdministrador);
    assert.equal(permite(proteccion.handlers[1],'Cajero').estado,403);
});
