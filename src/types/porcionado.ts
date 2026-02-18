export interface Porcionado {
  id: string;
  producto: string;
  gramaje: number;
  cantidad: number;
  fecha: Date;
  estado: 'pendiente' | 'porcionado';
  createdAt: Date;
  updatedAt: Date;
}
