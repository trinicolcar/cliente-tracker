# ========================================
# Cliente Tracker - Inicializador PowerShell
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLIENTE TRACKER" -ForegroundColor Yellow
Write-Host "  Sistema de Gestion de Clientes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js esta instalado
try {
    $nodeVersion = node --version
    Write-Host "[1/4] Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado." -ForegroundColor Red
    Write-Host "Por favor instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""

# Verificar dependencias
Write-Host "[2/4] Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias por primera vez..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Fallo la instalacion de dependencias" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# Generar cliente de Prisma
Write-Host "[3/4] Generando cliente de base de datos..." -ForegroundColor Cyan
npm run prisma:generate | Out-Null

Write-Host "[4/4] Iniciando aplicacion..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  El sistema se esta iniciando..." -ForegroundColor White
Write-Host ""
Write-Host "  Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  El navegador se abrira automaticamente" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Esperar 3 segundos
Start-Sleep -Seconds 3

# Abrir navegador
Start-Process "http://localhost:8080"

# Iniciar aplicacion
npm run dev:all
