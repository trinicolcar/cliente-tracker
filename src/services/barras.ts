import { Barra } from '@/types/barra';
import { api } from './api';

export const barrasService = {
  getAll: async (params?: { fecha?: string; disponible?: boolean }): Promise<Barra[]> => {
    const query = new URLSearchParams();
    if (params?.fecha) query.set('fecha', params.fecha);
    if (params?.disponible !== undefined) query.set('disponible', String(params.disponible));
    const qs = query.toString();
    return api.get(`/barras${qs ? `?${qs}` : ''}`);
  },

  create: async (data: {
    pesoGramos: number;
    cantidad: number;
    fechaProduccion: Date;
    disponible?: boolean;
  }): Promise<Barra> => {
    return api.post('/barras', data);
  },

  update: async (id: string, data: Partial<Barra>): Promise<Barra> => {
    return api.patch(`/barras/${id}`, data);
  },

  delete: async (id: string): Promise<boolean> => {
    return api.delete(`/barras/${id}`);
  },
};
