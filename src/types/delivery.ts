export interface Hamburguesa {
  id: string;
  cantidad: number;      // Cantidad de unidades
  gramaje: number;       // Peso en gramos
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
  deliveryId: string; // ID de entrega asociada
  monto: number;         // Monto pagado
  fechaPago: Date;       // Fecha del pago
  metodo: 'efectivo' | 'transferencia' | 'otro';
  descripcion?: string;  // Notas del pago
}

export type DeliveryFormData = Omit<Delivery, 'id' | 'createdAt'>;
