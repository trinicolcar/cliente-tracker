export interface InvoiceItem {
  descripcion?: string;
  cantidad: number;
  gramaje?: number;
  precio?: number;
}

export interface InvoicePago {
  id: string;
  monto: number;
  fechaPago: string;
  metodo?: string;
}

export interface Invoice {
  deliveryId: string;
  fecha: string;
  client: {
    id: string;
    nombre: string;
    telefono?: string;
    direccion?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  pagos: InvoicePago[];
  balanceDue: number;
}
