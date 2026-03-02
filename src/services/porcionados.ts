import { Porcionado } from '@/types/porcionado';
import { api } from './api';

export const porcionadosService = {
  getByDate: async (fecha: string): Promise<any[]> => {
    return api.get(`/porcionados?fecha=${encodeURIComponent(fecha)}`);
  },

  updateEstado: async (
    id: string,
    estado: Porcionado['estado'],
    fecha?: string
  ): Promise<Porcionado> => {
    return api.patch(`/porcionados/${id}`, { estado, fecha });
  },
  markAndCreateIfMissing: async (data: {
    producto: string;
    gramaje: number;
    cantidad: number;
    fecha: string;
    nombre_cliente?: string;
  }): Promise<Porcionado> => {
    return api.post('/porcionados/mark', data);
  },
};
