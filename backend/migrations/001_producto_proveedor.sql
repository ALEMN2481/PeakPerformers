-- ControlStock: relación de productos con sus proveedores para RF03.
-- Ejecutar UNA SOLA VEZ como administrador de MariaDB, después de respaldar la BD.
USE controlstock;
CREATE TABLE IF NOT EXISTS producto_proveedor (
  id_producto INT(11) NOT NULL,
  id_proveedor INT(11) NOT NULL,
  costo_referencia DECIMAL(10,2) DEFAULT NULL,
  es_principal TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id_producto, id_proveedor),
  KEY idx_proveedor (id_proveedor),
  CONSTRAINT fk_pp_producto FOREIGN KEY (id_producto)
    REFERENCES producto (id_producto) ON UPDATE CASCADE,
  CONSTRAINT fk_pp_proveedor FOREIGN KEY (id_proveedor)
    REFERENCES proveedor (id_proveedor) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- RF02: especificaciones técnicas por producto (sin alterar producto existente).
CREATE TABLE IF NOT EXISTS producto_especificacion (
  id_especificacion INT NOT NULL AUTO_INCREMENT,
  id_producto INT(11) NOT NULL,
  atributo VARCHAR(60) NOT NULL,
  valor VARCHAR(255) NOT NULL,
  PRIMARY KEY(id_especificacion),
  UNIQUE KEY uk_producto_atributo (id_producto, atributo),
  CONSTRAINT fk_especificacion_producto FOREIGN KEY (id_producto)
    REFERENCES producto(id_producto) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
