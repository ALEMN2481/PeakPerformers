-- Acceso individual de proveedores a sus órdenes.
-- Ejecutar después de respaldar la base de datos. No elimina datos existentes.
USE controlstock;

CREATE TABLE IF NOT EXISTS usuario_proveedor (
    id_usuario INT(11) NOT NULL,
    id_proveedor INT(11) NOT NULL,
    PRIMARY KEY (id_usuario),
    KEY idx_usuario_proveedor_proveedor (id_proveedor),
    CONSTRAINT fk_usuario_proveedor_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_proveedor_proveedor FOREIGN KEY (id_proveedor)
        REFERENCES proveedor(id_proveedor) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS confirmacion_proveedor (
    id_orden INT(11) NOT NULL,
    id_usuario INT(11) NOT NULL,
    fecha_confirmacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_orden),
    KEY idx_confirmacion_usuario (id_usuario),
    CONSTRAINT fk_confirmacion_orden FOREIGN KEY (id_orden)
        REFERENCES orden_compra(id_orden) ON DELETE RESTRICT,
    CONSTRAINT fk_confirmacion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Crear el rol solo si todavía no está registrado.
INSERT INTO rol (nombre_rol, descripcion)
SELECT 'Proveedor', 'Consulta y confirma órdenes propias'
WHERE NOT EXISTS (
    SELECT 1 FROM rol WHERE LOWER(TRIM(nombre_rol)) = 'proveedor'
);
