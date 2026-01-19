export interface Client {
  id: string;
  fechaInicial: Date;
  mes: string;
  nombre: string;
  activo: boolean;
  telefono: string;
  porComida: number;
  alDia: number;
  porPedido: number;
  totalPorciones: number;
  duracionPedido: number;
  proximaEntrega: Date;
  valorKg: number;
  valorPedido: number;
  direccion: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  estadoCuenta: number;
}

export type ClientFormData = Omit<Client, 'id'>;
