import { Porcionado } from '@/types/porcionado';
import { api } from './api';

export const porcionadosService = {
  getByDate: async (fecha: string): Promise<Porcionado[]> => {
    return api.get(`/porcionados?fecha=${encodeURIComponent(fecha)}`);
  },

  updateEstado: async (
    id: string,
    estado: Porcionado['estado'],
    fecha?: string
  ): Promise<Porcionado> => {
    return api.patch(`/porcionados/${id}`, { estado, fecha });
  },
};
