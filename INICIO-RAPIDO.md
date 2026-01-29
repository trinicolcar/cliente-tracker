# 🚀 Guía de Inicio Rápido

## Iniciar la Aplicación

### ✨ Método Más Fácil (Recomendado)

**Doble click en:** `start-app.bat`

Esto iniciará automáticamente:
- ✅ El servidor backend (puerto 3000)
- ✅ La aplicación frontend (puerto 5173)
- ✅ Abrirá el navegador automáticamente

---

## 📋 Primera Vez

Si es la **primera vez** que inicias el proyecto, ejecuta primero:

**Doble click en:** `setup-first-time.bat`

Este script:
1. Verifica que Node.js esté instalado
2. Instala todas las dependencias necesarias
3. Configura la base de datos
4. (Opcional) Importa los datos del Excel

**⏱️ Tiempo estimado:** 2-5 minutos

---

## 🛠️ Métodos Alternativos

### Opción 1: PowerShell (Windows)
```powershell
.\start-app.ps1
```

### Opción 2: Terminal Manual
```bash
npm run dev:all
```

---

## 🌐 URLs del Sistema

Una vez iniciado, accede a:

- **Aplicación Web:** http://localhost:5173
- **API Backend:** http://localhost:3000

---

## 🔧 Solución de Problemas

### "Node.js no está instalado"
1. Descarga Node.js desde: https://nodejs.org/
2. Instala la versión LTS (recomendada)
3. Reinicia la terminal

### "Falta node_modules"
Ejecuta: `setup-first-time.bat`

### "Puerto ya en uso"
Cierra otras aplicaciones que usen los puertos 3000 o 5173

### "Error de base de datos"
1. Elimina el archivo `prisma/dev.db`
2. Ejecuta: `setup-first-time.bat`

---

## ⚡ Atajos de Teclado

- `Ctrl + C` - Detener la aplicación
- Cerrar la ventana - También detiene la aplicación

---

## 📝 Comandos Útiles

```bash
# Ver la base de datos visualmente
npm run prisma:studio

# Reiniciar base de datos
npm run prisma:migrate

# Importar datos del Excel
npx tsx server/import-xlsx.ts
```

---

## 🎯 Crear Acceso Directo en el Escritorio

1. **Click derecho** en `start-app.bat`
2. Selecciona **"Crear acceso directo"**
3. Arrastra el acceso directo a tu escritorio
4. (Opcional) Click derecho > Propiedades > Cambiar icono

¡Listo! Ahora puedes iniciar el sistema con un solo click desde tu escritorio.

---

## 📦 Estructura de Archivos de Inicio

```
├── start-app.bat           ← Iniciar aplicación (USAR ESTE)
├── start-app.ps1           ← Versión PowerShell
├── setup-first-time.bat    ← Configuración inicial (primera vez)
└── INICIO-RAPIDO.md        ← Este archivo
```

---

## 💡 Consejos

- **Mantén abierta** la ventana de terminal mientras uses la aplicación
- **No cierres** el navegador, es tu interfaz principal
- Si algo falla, cierra todo y ejecuta `start-app.bat` nuevamente
- Los datos se guardan automáticamente en la base de datos

---

## 🆘 Soporte

Si encuentras problemas:
1. Verifica que Node.js esté instalado
2. Ejecuta `setup-first-time.bat` de nuevo
3. Revisa que los puertos 3000 y 5173 estén libres
4. Reinicia tu computadora si todo lo demás falla

---

**¡Disfruta usando Cliente Tracker!** 🎉
