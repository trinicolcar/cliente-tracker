export interface Hamburguesa {
  id: string;
  tipo?: 'hamburguesa' | 'nuggets';  // Tipo de producto
  cantidad: number;      // Cantidad de unidades o paquetes
  gramaje: number;       // Peso en gramos
  precio?: number;       // Precio unitario o del paquete
  descripcion?: string;  // Ej: "Sencilla", "Doble", "Con queso"
}

export interface Delivery {
  id: string;
  clientId: string;
  fecha: Date;           // Fecha programada de entrega
  hamburguesas: Hamburguesa[];
  precioTotal: number;   // Precio total de la entrega
  createdAt: Date;       // Fecha de creación del registro
}

export interface Pago {
  id: string;
  clientId: string;
  deliveryId?: string | null; // ID de entrega asociada (opcional)
  monto: number;         // Monto pagado
  fechaPago: Date;       // Fecha del pago
  metodo: 'efectivo' | 'transferencia' | 'otro';
  descripcion?: string;  // Notas del pago
}

export type DeliveryFormData = Omit<Delivery, 'id' | 'createdAt'>;
