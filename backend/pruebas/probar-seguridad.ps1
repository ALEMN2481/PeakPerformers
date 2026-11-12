# Ejecutar desde cualquier carpeta con el backend encendido.
$base = 'http://localhost:3000/api'
Write-Host '1) Comprobar que DELETE sin token este prohibido (401)' -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/productos/3" -Method DELETE -ErrorAction Stop | Out-Null
    Write-Host 'FALLO: DELETE sin token fue aceptado' -ForegroundColor Red
} catch {
    $codigo = [int]$_.Exception.Response.StatusCode
    if ($codigo -eq 401) { Write-Host 'OK: 401 Unauthorized' -ForegroundColor Green }
    else { Write-Host "Respuesta inesperada: $codigo" -ForegroundColor Yellow }
}

Write-Host '2) Iniciar sesion como Administrador local' -ForegroundColor Cyan
$correo = 'administrador.test@controlstock.invalid'
$segura = Read-Host -AsSecureString 'Contrasena generada para Administrador'
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura)
try { $clave = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
$body = @{ correo = $correo; contrasena = $clave } | ConvertTo-Json
$sesion = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body $body
$clave = $null
$headers = @{ Authorization = "Bearer $($sesion.token)" }
Write-Host 'Login exitoso. Perfil:' -ForegroundColor Green
Invoke-RestMethod -Uri "$base/auth/me" -Headers $headers | Format-List
Write-Host 'Consulta de productos con token:' -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/productos" -Headers $headers | Format-Table
