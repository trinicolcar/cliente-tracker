# Cliente Tracker - Base de Datos Integrada

Sistema completo de gestión de clientes con base de datos SQLite y API REST.

## 🚀 Características

✅ **Base de datos SQLite** con Prisma ORM  
✅ **API REST** con Express.js  
✅ **Frontend React** con React Query  
✅ **Gestión completa de clientes, entregas y pagos**  
✅ **Sincronización automática** entre frontend y backend  

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Generar cliente de Prisma
npm run prisma:generate

# Migrar base de datos
npm run prisma:migrate

# (Opcional) Poblar base de datos con datos de prueba
npm run db:seed
```

## 🎯 Uso

### Iniciar desarrollo (Frontend + Backend)

```bash
npm run dev:all
```

Esto iniciará:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Iniciar servicios por separado

```bash
# Solo frontend
npm run dev

# Solo backend
npm run server
```

## 📚 API Endpoints

### Clientes
- `GET /api/clients` - Obtener todos los clientes
- `GET /api/clients/:id` - Obtener un cliente
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Entregas
- `GET /api/deliveries` - Obtener todas las entregas
- `GET /api/deliveries/:id` - Obtener una entrega
- `GET /api/deliveries/client/:clientId` - Entregas por cliente
- `POST /api/deliveries` - Crear entrega
- `PUT /api/deliveries/:id` - Actualizar entrega
- `DELETE /api/deliveries/:id` - Eliminar entrega

### Pagos
- `GET /api/pagos` - Obtener todos los pagos
- `GET /api/pagos/:id` - Obtener un pago
- `GET /api/pagos/client/:clientId` - Pagos por cliente
- `POST /api/pagos` - Registrar pago
- `PUT /api/pagos/:id` - Actualizar pago
- `DELETE /api/pagos/:id` - Eliminar pago

## 🗄️ Base de Datos

### Estructura

- **Client**: Información de clientes
- **Delivery**: Entregas programadas
- **Hamburguesa**: Detalles de productos en entregas
- **Pago**: Registro de pagos

### Comandos Prisma

```bash
# Ver base de datos en navegador
npm run prisma:studio

# Crear migración
npm run prisma:migrate

# Generar cliente
npm run prisma:generate

# Resetear y poblar datos
npm run db:seed
```

## 🏗️ Estructura del Proyecto

```
cliente-tracker/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── dev.db             # Base de datos SQLite
│   └── migrations/        # Migraciones
├── server/
│   ├── index.ts           # Servidor Express
│   ├── db.ts              # Cliente Prisma
│   ├── seed.ts            # Script de migración de datos
│   └── routes/
│       ├── clients.ts     # Rutas de clientes
│       ├── deliveries.ts  # Rutas de entregas
│       └── pagos.ts       # Rutas de pagos
├── src/
│   ├── services/          # Servicios de API
│   │   ├── api.ts
│   │   ├── clients.ts
│   │   ├── deliveries.ts
│   │   └── pagos.ts
│   ├── pages/             # Páginas de la aplicación
│   ├── components/        # Componentes React
│   └── types/             # Definiciones de tipos
└── package.json
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
```

### Configuración de Base de Datos

La configuración está en `prisma.config.ts`:

```typescript
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
```

## 🚀 Producción

```bash
# Build frontend
npm run build

# Iniciar servidor backend
npm run server:prod
```

## 📝 Notas

- La base de datos SQLite se crea automáticamente en `prisma/dev.db`
- Los datos se persisten localmente
- React Query maneja el caché y sincronización
- El backend usa Express.js con TypeScript

## 🐛 Troubleshooting

### Error de conexión a la API
Verifica que el backend esté corriendo en el puerto 3001:
```bash
npm run server
```

### Error de Prisma
Regenera el cliente:
```bash
npm run prisma:generate
```

### Base de datos corrupta
Elimina y recrea:
```bash
rm prisma/dev.db
npm run prisma:migrate
npm run db:seed
```

## 📄 Licencia

MIT
