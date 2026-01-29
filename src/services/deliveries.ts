import { Delivery, DeliveryFormData } from '@/types/delivery';
import { api } from './api';

export const deliveriesService = {
  getAll: async (): Promise<Delivery[]> => {
    return api.get('/deliveries');
  },

  getById: async (id: string): Promise<Delivery> => {
    return api.get(`/deliveries/${id}`);
  },

  getByClientId: async (clientId: string): Promise<Delivery[]> => {
    return api.get(`/deliveries/client/${clientId}`);
  },

  create: async (data: DeliveryFormData): Promise<Delivery> => {
    return api.post('/deliveries', data);
  },

  update: async (id: string, data: DeliveryFormData): Promise<Delivery> => {
    return api.put(`/deliveries/${id}`, data);
  },

  reschedule: async (id: string, fecha: Date): Promise<Delivery> => {
    return api.patch(`/deliveries/${id}/reschedule`, { fecha: fecha.toISOString() });
  },

  delete: async (id: string): Promise<boolean> => {
    return api.delete(`/deliveries/${id}`);
  },
};
