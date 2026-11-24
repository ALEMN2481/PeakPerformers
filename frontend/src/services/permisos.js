// Los roles se reconocen exclusivamente por el nombre que confirma GET /api/auth/me.
// No inferir "Proveedor" a partir de id_rol=3: la BD antigua tenía "Bodega" en ese ID.
export const ROLES = Object.freeze({ ADMINISTRADOR: 'Administrador', CAJERO: 'Cajero', PROVEEDOR: 'Proveedor' })

export function nombreRol(usuario) {
  const rol = String(usuario?.rol ?? '').trim().toLowerCase()
  return Object.values(ROLES).find(nombre => nombre.toLowerCase() === rol) || null
}

export function esAdministrador(usuario) { return nombreRol(usuario) === ROLES.ADMINISTRADOR }
export function esCajero(usuario) { return nombreRol(usuario) === ROLES.CAJERO }
export function esProveedor(usuario) { return nombreRol(usuario) === ROLES.PROVEEDOR }
export function puedeVender(usuario) { return esAdministrador(usuario) || esCajero(usuario) }
// El permiso nuevo del Cajero cubre únicamente operaciones CRUD de PRODUCTOS.
// Categorías, compras, proveedores, recepción, inventario manual y reportes siguen bajo Admin.
export function puedeGestionarProductos(usuario) { return esAdministrador(usuario) || esCajero(usuario) }
export function puedeGestionarCategorias(usuario) { return esAdministrador(usuario) }
export function puedeGestionarCompras(usuario) { return esAdministrador(usuario) }
export function puedeEditarFichaTecnica(usuario) { return esAdministrador(usuario) }

export const PAGINAS_POR_ROL = Object.freeze({
  [ROLES.ADMINISTRADOR]: ['panel', 'catalogo', 'movimientos', 'reabastecimiento', 'orden', 'reportes', 'consulta', 'mostrador', 'usuarios'],
  [ROLES.CAJERO]: ['panel', 'consulta', 'mostrador', 'catalogo'],
  [ROLES.PROVEEDOR]: ['proveedor'],
})

export function paginaInicial(usuario) {
  const rol = nombreRol(usuario)
  if (rol === ROLES.PROVEEDOR) return 'proveedor'
  if (rol === ROLES.ADMINISTRADOR || rol === ROLES.CAJERO) return 'panel'
  return 'sin-acceso'
}

export function puedeAcceder(usuario, pagina) {
  return (PAGINAS_POR_ROL[nombreRol(usuario)] ?? []).includes(pagina)
}
