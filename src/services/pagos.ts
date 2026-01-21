import { Pago } from '@/types/delivery';
import { api } from './api';

export const pagosService = {
  getAll: async (): Promise<Pago[]> => {
    return api.get('/pagos');
  },

  getById: async (id: string): Promise<Pago> => {
    return api.get(`/pagos/${id}`);
  },

  getByClientId: async (clientId: string): Promise<Pago[]> => {
    return api.get(`/pagos/client/${clientId}`);
  },

  create: async (data: Omit<Pago, 'id'>): Promise<Pago> => {
    return api.post('/pagos', data);
  },

  update: async (id: string, data: Partial<Pago>): Promise<Pago> => {
    return api.put(`/pagos/${id}`, data);
  },

  delete: async (id: string): Promise<boolean> => {
    return api.delete(`/pagos/${id}`);
  },
};
