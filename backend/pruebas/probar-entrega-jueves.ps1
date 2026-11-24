# Compatible con el comando anterior de pruebas. Mantiene la clave fuera del historial.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $correo=Read-Host 'Correo Admin [administrador.test@controlstock.invalid]'
    if(-not $correo) { $correo='administrador.test@controlstock.invalid' }
    $clave=Read-Host -AsSecureString 'Contrasena del Administrador'
    $env:CONTROLSTOCK_ADMIN_CORREO=$correo
    $env:CONTROLSTOCK_ADMIN_PASSWORD=[System.Net.NetworkCredential]::new('',$clave).Password
    $clave=$null
    & node pruebas/prueba-integral.js
    if ($LASTEXITCODE -ne 0) { throw 'Prueba integral fallida' }
} finally {
    Remove-Item Env:CONTROLSTOCK_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:CONTROLSTOCK_ADMIN_CORREO -ErrorAction SilentlyContinue
    Pop-Location
}
