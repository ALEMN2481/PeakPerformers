// Solo para pruebas locales: crea o actualiza una cuenta Proveedor con clave temporal.
require('dotenv').config();
const db = require('../src/config/database');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');

async function ejecutar() {
    if (process.argv[2] === '--listar') {
        const [proveedores] = await db.query(
            'SELECT id_proveedor, razon_social FROM proveedor ORDER BY id_proveedor LIMIT 50');
        console.table(proveedores);
        return;
    }
    const texto = process.argv[2];
    if (!/^[1-9]\d*$/.test(texto || '') || !Number.isSafeInteger(Number(texto))) {
        throw new Error('Uso: node scripts/crear-proveedor-demo.js --listar | ID_PROVEEDOR');
    }
    const idProveedor = Number(texto);
    const [proveedores] = await db.query(
        'SELECT id_proveedor, razon_social FROM proveedor WHERE id_proveedor=?', [idProveedor]);
    if (!proveedores.length) throw new Error('No existe el proveedor elegido');
    const [roles] = await db.query("SELECT id_rol FROM rol WHERE LOWER(TRIM(nombre_rol))='proveedor' LIMIT 1");
    if (!roles.length) throw new Error('Falta el rol Proveedor. Ejecuta la migración 002.');

    const correo = `proveedor.${idProveedor}.test@controlstock.invalid`;
    const clave = crypto.randomBytes(24).toString('base64url');
    const hash = await bcrypt.hash(clave, 12);
    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        const [existentes] = await conexion.query(
            'SELECT id_usuario FROM usuario WHERE correo=? FOR UPDATE', [correo]);
        let idUsuario;
        if (existentes.length) {
            idUsuario = existentes[0].id_usuario;
            await conexion.query(
                'UPDATE usuario SET id_rol=?, nombre=?, contrasena_hash=?, estado=1 WHERE id_usuario=?',
                [roles[0].id_rol, `Proveedor ${proveedores[0].razon_social}`.slice(0, 100), hash, idUsuario]);
        } else {
            const [r] = await conexion.query(
                'INSERT INTO usuario (id_rol,nombre,correo,contrasena_hash,estado) VALUES (?,?,?,?,1)',
                [roles[0].id_rol, `Proveedor ${proveedores[0].razon_social}`.slice(0, 100), correo, hash]);
            idUsuario = r.insertId;
        }
        await conexion.query(`INSERT INTO usuario_proveedor (id_usuario,id_proveedor) VALUES (?,?)
            ON DUPLICATE KEY UPDATE id_proveedor=VALUES(id_proveedor)`, [idUsuario, idProveedor]);
        await conexion.commit();
        console.log('Cuenta de Proveedor preparada para QA');
        console.log('Empresa:', proveedores[0].razon_social);
        console.log('Correo:', correo);
        console.log('Clave temporal (NO enviar por chat):', clave);
        console.log('ATENCION: este comando cambia la contraseña si se ejecuta otra vez.');
    } catch (err) {
        await conexion.rollback();
        throw err;
    } finally { conexion.release(); }
}

ejecutar().catch(e => { console.error('No se pudo crear cuenta:', e.message); process.exitCode=1; })
    .finally(() => db.end());
