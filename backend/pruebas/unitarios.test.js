const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { idValido, decimalValido, milUnidades, subtotalCentavos } = require('../src/utils/validaciones');

// Carga servicios usando un pool simulado para probar transacciones sin tocar MariaDB.
function cargarServicio(ruta, db) {
    const archivo = path.join(__dirname, '..', 'src/services', ruta);
    const codigo = fs.readFileSync(archivo, 'utf8');
    const modulo = { exports:{} };
    const fakeRequire = (nombre) => nombre === '../config/database'
        ? db : nombre === '../utils/validaciones'
            ? require('../src/utils/validaciones') : require(nombre);
    vm.runInNewContext('(function(require,module,exports){' + codigo + '\n})', {console, Date, Number, BigInt, Map, Set, Error}, {filename:archivo})(fakeRequire, modulo, modulo.exports);
    return modulo.exports;
}

test('validaciones: IDs, decimales y centavos',()=>{
    assert.equal(idValido(1),true);
    assert.equal(idValido(0),false);
    assert.equal(idValido('1'),false);
    assert.equal(decimalValido(2.125,3,9999999.999),true);
    assert.equal(decimalValido(2.1234,3,9999999.999),false);
    assert.equal(milUnidades(1.5),1500);
    assert.equal(subtotalCentavos(2.5,12000),3000000n);
});

function ventaFake(stock=10) {
    const log=[];
    const llamadas=[];
    const columnasVenta = [
        {Field:'id_venta', Null:'NO', Default:null,Extra:'auto_increment'},
        {Field:'id_cajero', Null:'NO', Default:null, Extra:''},
        {Field:'total_venta', Null:'NO', Default:null, Extra:''},
        {Field:'metodo_pago', Null:'NO', Default:null, Extra:''},
        {Field:'documento_cliente', Null:'YES', Default:null, Extra:''},
        {Field:'fecha_hora', Null:'YES', Default:'current_timestamp()',Extra:''}
    ];
    const columnasDetalle = [
        {Field:'id_detalle_venta',Null:'NO',Default:null,Extra:'auto_increment'},
        {Field:'id_venta',Null:'NO',Default:null,Extra:''},
        {Field:'id_producto',Null:'NO',Default:null,Extra:''},
        {Field:'cantidad',Null:'NO',Default:null,Extra:''},
        {Field:'precio_unitario',Null:'NO',Default:null,Extra:''}
    ];
    const conn={
        beginTransaction:async()=>log.push('BEGIN'),
        commit:async()=>log.push('COMMIT'),
        rollback:async()=>log.push('ROLLBACK'),
        release:()=>log.push('RELEASE'),
        query:async(sql,values=[])=>{
            log.push(sql);
            llamadas.push({sql, values});
            if(sql.startsWith('SHOW COLUMNS FROM `venta`'))return [columnasVenta];
            if(sql.startsWith('SHOW COLUMNS FROM `detalle_venta`'))return [columnasDetalle];
            if(sql.includes('SELECT id_producto, nombre, stock_actual'))return [[{id_producto:7,nombre:'Martillo',stock_actual:stock,precio_venta:'18000.00'}]];
            if(sql.includes('INSERT INTO `venta`'))return [{insertId:31}];
            if(sql.includes('INSERT INTO `detalle_venta`'))return [{insertId:32}];
            if(sql.includes('INSERT INTO movimiento_inventario'))return [{insertId:33}];
            if(sql.includes('UPDATE producto SET stock_actual'))return [{affectedRows:1}];
            throw new Error('SQL no simulada: '+sql);
        }
    };
    return { log, llamadas, db:{ getConnection:async()=>conn } };
}

test('venta: descuenta stock, registra detalle y movimiento y confirma',async()=>{
    const {log,db}=ventaFake(10);
    const s=cargarServicio('ventas.service.js',db);
    const resultado=await s.registrar(2,[{id_producto:7,cantidad:2}],'Efectivo');
    assert.equal(resultado.id_venta,31);
    assert.equal(resultado.total,36000);
    assert.equal(log.filter(x=>x==='COMMIT').length,1);
    assert.ok(log.some(x=>x.includes('UPDATE producto SET stock_actual')));
    assert.ok(log.some(x=>x.includes('INSERT INTO movimiento_inventario')));
});

test('venta: stock insuficiente revierte sin vender',async()=>{
    const {log,db}=ventaFake(1);
    const s=cargarServicio('ventas.service.js',db);
    await assert.rejects(()=>s.registrar(2,[{id_producto:7,cantidad:2}],'Efectivo'),err=>err.status===409);
    assert.ok(log.includes('ROLLBACK'));
    assert.ok(!log.some(x=>x.includes('INSERT INTO `venta`')));
});

function cargarModulo(ruta, mocks) {
    const codigo=fs.readFileSync(ruta,'utf8');
    const m={exports:{}};
    const fakeRequire=(nombre)=>Object.hasOwn(mocks,nombre)?mocks[nombre]:require(nombre);
    vm.runInNewContext('(function(require,module,exports){'+codigo+'\n})',
        { console, Number, String, Error, Set, Date }, {filename:ruta})(fakeRequire,m,m.exports);
    return m.exports;
}
function respuestaFake() {
    return { codigo:200, cuerpo:null, status(n){this.codigo=n;return this;},
        json(v){this.cuerpo=v;return this;} };
}
test('autenticación: DELETE sin token es 401',async()=>{
    const modulo=cargarModulo(path.join(__dirname,'../src/middlewares/auth.middleware.js'),{
        'jsonwebtoken':{verify:()=>({sub:'2'})},
        '../config/database':{query:async()=>[[]]}
    });
    const res=respuestaFake();
    await modulo.autenticar({headers:{}},res,()=>{throw Error('No debe continuar')});
    assert.equal(res.codigo,401);
});
test('roles: Cajero 403 y Administrador autorizado',()=>{
    const modulo=cargarModulo(path.join(__dirname,'../src/middlewares/auth.middleware.js'),{
        'jsonwebtoken':{verify:()=>({sub:'2'})},
        '../config/database':{query:async()=>[[]]}
    });
    const res=respuestaFake();
    let autorizado=false;
    modulo.soloAdministrador({usuario:{rol:'Cajero'}},res,()=>{autorizado=true});
    assert.equal(res.codigo,403);
    assert.equal(autorizado,false);
    modulo.soloAdministrador({usuario:{rol:'Administrador'}},respuestaFake(),()=>{autorizado=true});
    assert.equal(autorizado,true);
});
test('auditoría: ignora id_usuario enviado en el body, usa JWT',async()=>{
    let recibido;
    const controlador=cargarModulo(path.join(__dirname,'../src/controllers/inventario.controller.js'),{
        '../services/inventario.service': {
            obtenerResumen:async()=>({}), listarExistencias:async()=>([]),
            listarStockBajo:async()=>([]),listarMovimientos:async()=>([]),
            registrarMovimiento:async(datos)=>{recibido=datos;return {id_movimiento:9};}
        }
    });
    const res=respuestaFake();
    await controlador.crearMovimiento({usuario:{id_usuario:2},
        body:{id_usuario:999,id_producto:7,tipo:'Entrada',cantidad:2}},res);
    assert.equal(res.codigo,201);
    assert.equal(recibido.id_usuario,2);
});


test('venta: usa columnas reales id_cajero y total_venta, no id_usuario', async () => {
    const { llamadas, db } = ventaFake(10);
    const servicio = cargarServicio('ventas.service.js', db);
    await servicio.registrar(3, [{ id_producto:7, cantidad:2 }], 'Tarjeta', '100200300');
    const cabecera = llamadas.find(x => x.sql.includes('INSERT INTO `venta`'));
    assert.ok(cabecera);
    assert.match(cabecera.sql, /`id_cajero`/);
    assert.match(cabecera.sql, /`total_venta`/);
    assert.match(cabecera.sql, /`metodo_pago`/);
    assert.match(cabecera.sql, /`documento_cliente`/);
    assert.equal(cabecera.values[0], 3);
    assert.ok(cabecera.values.includes('100200300'));
    assert.ok(cabecera.values.includes('Tarjeta'));
});

test('venta: precio y usuario proceden de BD/JWT, no del cliente', async () => {
    const { llamadas, db } = ventaFake(10);
    const servicio = cargarServicio('ventas.service.js', db);
    await servicio.registrar(3, [{ id_producto:7, cantidad:1, precio_unitario:1, id_usuario:999 }], 'Efectivo');
    const cabecera = llamadas.find(x => x.sql.includes('INSERT INTO `venta`'));
    assert.equal(cabecera.values[0], 3);
    assert.ok(cabecera.values.includes('18000.00'));
    assert.ok(!cabecera.values.includes(999));
});

test('roles: Cajero puede vender pero no administrar', () => {
    const modulo=cargarModulo(path.join(__dirname,'../src/middlewares/auth.middleware.js'),{
        'jsonwebtoken':{verify:()=>({sub:'3'})},
        '../config/database':{query:async()=>[[]]}
    });
    const res=respuestaFake();
    let vendido=false;
    modulo.puedeVender({usuario:{rol:'Cajero'}},res,()=>{vendido=true});
    assert.equal(vendido,true);
    let modificado=false;
    const prohibicion=respuestaFake();
    modulo.soloAdministrador({usuario:{rol:'Cajero'}},prohibicion,()=>{modificado=true});
    assert.equal(modificado,false);
    assert.equal(prohibicion.codigo,403);
    const noRol=respuestaFake();
    modulo.puedeVender({usuario:{rol:'Invitado'}},noRol,()=>{});
    assert.equal(noRol.codigo,403);
});

test('venta: valida documento_cliente y cantidades antes de acceder a BD', async () => {
    let llamadas=0;
    const controlador=cargarModulo(path.join(__dirname,'../src/controllers/ventas.controller.js'), {
        '../services/ventas.service': {registrar:async()=>{llamadas++;return {};}},
        '../utils/validaciones': require('../src/utils/validaciones')
    });
    const res=respuestaFake();
    await controlador.registrar({usuario:{id_usuario:3}, body:{
        detalles:[{id_producto:7,cantidad:1}], documento_cliente:'x'.repeat(31)
    }},res);
    assert.equal(res.codigo,400);
    assert.equal(llamadas,0);
});

test('venta: sin existencias no confirma transacción', async () => {
    const { log, db } = ventaFake(0);
    const servicio = cargarServicio('ventas.service.js',db);
    await assert.rejects(()=>servicio.registrar(3,[{id_producto:7,cantidad:1}],'Efectivo'),
        err=>err.status===409);
    assert.equal(log.filter(x=>x==='COMMIT').length,0);
    assert.equal(log.filter(x=>x==='ROLLBACK').length,1);
});

test('venta: rechaza pago inválido antes de insertar', async () => {
    const controlador=cargarModulo(path.join(__dirname,'../src/controllers/ventas.controller.js'),{
        '../services/ventas.service': {registrar:async()=>{throw Error('No debe insertar')}},
        '../utils/validaciones': require('../src/utils/validaciones')
    });
    const res=respuestaFake();
    await controlador.registrar({usuario:{id_usuario:2},body:{
        detalles:[{id_producto:7,cantidad:1}],metodo_pago:''
    }},res);
    assert.equal(res.codigo,400);
});
