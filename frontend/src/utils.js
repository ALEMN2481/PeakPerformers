// Formato de pesos colombianos: $1.234.000
export const cop = (n) => '$' + Number(n).toLocaleString('es-CO')
export const num = (n) => Number(n).toLocaleString('es-CO')
