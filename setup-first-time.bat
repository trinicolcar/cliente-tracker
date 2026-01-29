@echo off
:: ========================================
:: Cliente Tracker - Configuracion Inicial
:: ========================================
title Cliente Tracker - Configuracion Inicial

echo.
echo ========================================
echo   CLIENTE TRACKER
echo   Configuracion Inicial del Sistema
echo ========================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Node.js detectado
node --version
echo.

:: Instalar dependencias
echo [2/5] Instalando dependencias del proyecto...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la instalacion de dependencias
    pause
    exit /b 1
)
echo.

:: Generar cliente Prisma
echo [3/5] Generando cliente de Prisma...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la generacion del cliente Prisma
    pause
    exit /b 1
)
echo.

:: Ejecutar migraciones
echo [4/5] Configurando base de datos...
call npm run prisma:migrate
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Las migraciones pueden requerir atencion manual
)
echo.

:: Importar datos (opcional)
echo [5/5] Importar datos del Excel? (S/N)
set /p IMPORT_DATA="Respuesta: "
if /i "%IMPORT_DATA%"=="S" (
    echo Importando datos...
    call npx tsx server/import-xlsx.ts
    if %errorlevel% neq 0 (
        echo [ADVERTENCIA] La importacion tuvo algunos problemas
    )
) else (
    echo Omitiendo importacion de datos
)
echo.

echo ========================================
echo   CONFIGURACION COMPLETADA
echo ========================================
echo.
echo El sistema esta listo para usarse.
echo Ejecuta "start-app.bat" para iniciar la aplicacion.
echo.
pause
