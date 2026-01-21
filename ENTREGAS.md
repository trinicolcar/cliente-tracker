# Cliente Tracker - Sistema de Entregas de Hamburguesas

Sistema web de seguimiento de clientes y planificación de entregas de hamburguesas con gestión por gramaje.

## Características Implementadas

### ✅ Gestión de Clientes
- Crear, editar y eliminar clientes
- Listar todos los clientes con búsqueda
- Ver información detallada de cada cliente
- Estado de cuenta de los clientes

### ✅ Agenda de Entregas de Hamburguesas (NUEVA)
- **Selección de Clientes**: Elige el cliente para la entrega
- **Selección de Fecha**: Planifica entregas para fechas específicas
- **Registro de Hamburguesas**: Agrega hamburguesas indicando:
  - Cantidad de unidades
  - Gramaje (peso en gramos)
  - Descripción opcional (Sencilla, Doble, Con queso, etc.)
- **Cálculo Automático**: Calcula el total de gramos por tipo
- **Entregas Agrupadas por Día**: Visualiza todas las entregas organizadas por día
- **Resumen por Día**: Totales de unidades y gramos por día
- **Detalles por Entrega**: Información de cliente, teléfono y desglose de hamburguesas

## Estructura de Carpetas

```
src/
├── components/
│   ├── delivery/
│   │   ├── ClientSelector.tsx      # Componente para seleccionar cliente
│   │   └── ProductForm.tsx         # Formulario para agregar hamburguesas
│   ├── clients/
│   │   ├── ClientFormDialog.tsx
│   │   ├── ClientsTable.tsx
│   │   └── DeleteClientDialog.tsx
│   ├── Navigation.tsx              # Navegación principal
│   └── ui/                         # Componentes de UI (shadcn)
├── pages/
│   ├── Index.tsx                   # Página de gestión de clientes
│   ├── Delivery.tsx                # Página de agenda de entregas (NUEVA)
│   └── NotFound.tsx
├── types/
│   ├── client.ts
│   └── delivery.ts                 # Tipos para entregas (NUEVA)
├── data/
│   └── mockClients.ts
└── App.tsx
```

## Rutas Disponibles

- `/` - Gestión de Clientes
- `/entregas` - Agenda de Entregas de Hamburguesas

## Cómo Usar

### Para Registrar una Entrega

1. Haz clic en la pestaña "Entregas" en el navegador superior
2. Selecciona un cliente activo del dropdown
3. Selecciona la fecha de entrega con el calendario
4. Agrega hamburguesas:
   - Ingresa la cantidad de unidades (ej: 10)
   - Ingresa el gramaje/peso (ej: 200)
   - Opcionalmente agrega descripción (ej: "Sencilla", "Doble")
   - Haz clic en "Agregar"
5. Edita o elimina hamburguesas si es necesario
6. Haz clic en "Guardar Entrega"
7. La entrega aparecerá automáticamente en la "Agenda de Entregas" agrupada por día

### Visualizar Agenda de Entregas

- Las entregas se organizan automáticamente por **días**
- Cada día muestra:
  - **Fecha**: Día de la semana y fecha
  - **Totales**: Unidades totales y gramos totales para ese día
  - **Entregas**: Lista de entregas con detalles por cliente
- Para cada entrega se muestra:
  - **Cliente**: Nombre y teléfono
  - **Hamburguesas**: Desglose con unidades, gramaje y total de gramos
  - **Totales**: Unidades y gramos de esa entrega

## Tipos de Datos

### Hamburguesa
```typescript
interface Hamburguesa {
  id: string;
  cantidad: number;      // Cantidad de unidades
  gramaje: number;       // Peso en gramos
  descripcion?: string;  // Ej: "Sencilla", "Doble", "Con queso"
}
```

### Delivery
```typescript
interface Delivery {
  id: string;
  clientId: string;
  fecha: Date;           // Fecha programada de entrega
  hamburguesas: Hamburguesa[];
  createdAt: Date;       // Fecha de creación del registro (para informes)
}
```

## Ejemplo de Uso

**Escenario**: María García quiere entregar hamburguesas el 20 de enero

1. Selecciona "María García López" del dropdown
2. Selecciona "20 de enero" en el calendario
3. Agrega:
   - 10 unidades de 200g (Sencilla)
   - 5 unidades de 300g (Doble)
4. Guarda la entrega
5. Verá automáticamente en la agenda:
   - **Día: Jueves, 20 de enero**
   - **Total: 15 unidades, 3500g**
   - **Entrega a María García López**: 10x200g + 5x300g

## Tecnologías Utilizadas

- **React 18** - Librería de UI
- **TypeScript** - Tipado estático
- **Vite** - Empaquetador y servidor de desarrollo
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes de interfaz
- **Sonner** - Notificaciones
- **date-fns** - Manejo de fechas
- **lucide-react** - Iconos
- **React Router** - Enrutamiento

## Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar producción
npm run preview

# Ejecutar pruebas
npm run test
```

## Próximas Mejoras Posibles

- **Módulo de Informes**: Reportes por cliente, por día, análisis de tendencias
- **Persistencia en Base de Datos**: Guardar entregas en un servidor
- **Edición de Entregas**: Modificar entregas ya registradas
- **Eliminación de Entregas**: Borrar entregas si es necesario
- **Exportar a PDF/Excel**: Reportes imprimibles
- **Confirmación de Entregas**: Marcar entregas como completadas
- **Historial Detallado**: Seguimiento de todas las entregas por período
- **Mapas con Geolocalización**: Ver entregas en mapa
- **Notificaciones**: Alertas para entregas próximas
