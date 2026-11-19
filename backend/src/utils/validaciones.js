// Validaciones compartidas por compras, ventas y abastecimiento.
const idValido = (valor) => Number.isSafeInteger(valor) && valor > 0;
const decimalValido = (numero, decimales, maximo, permitirCero = false) =>
    typeof numero === "number" && Number.isFinite(numero) &&
    (permitirCero ? numero >= 0 : numero > 0) && numero <= maximo &&
    Math.abs(numero * 10 ** decimales - Math.round(numero * 10 ** decimales)) < 0.00001;
const milUnidades = (numero) => Math.round(Number(numero) * 1000);
const centavos = (numero) => Math.round(Number(numero) * 100);
const subtotalCentavos = (cantidad, precio) =>
    (BigInt(milUnidades(cantidad)) * BigInt(centavos(precio)) + 500n) / 1000n;
const fallo = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });
module.exports = { idValido, decimalValido, milUnidades, centavos, subtotalCentavos, fallo };
