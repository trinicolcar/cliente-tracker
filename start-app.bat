@echo off
:: ========================================
:: Cliente Tracker - Inicializador
:: ========================================
title Cliente Tracker - Iniciando...

echo.
echo ========================================
echo   CLIENTE TRACKER
echo   Sistema de Gestion de Clientes
echo ========================================
echo.

:: Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Verificando instalacion de Node.js...
node --version
echo.

:: Verificar si npm esta instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta instalado.
    pause
    exit /b 1
)

echo [2/4] Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias por primera vez...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
)

:: Generar cliente de Prisma
echo [3/4] Generando cliente de base de datos...
call npm run prisma:generate >nul 2>&1

echo [4/4] Iniciando aplicacion...
echo.
echo ========================================
echo   El sistema se esta iniciando...
echo   
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo   
echo   El navegador se abrira automaticamente
echo ========================================
echo.

:: Esperar 3 segundos antes de abrir el navegador
timeout /t 3 /nobreak >nul

:: Abrir el navegador en segundo plano
start http://localhost:5173

:: Iniciar el servidor y el frontend
call npm run dev:all

pause
