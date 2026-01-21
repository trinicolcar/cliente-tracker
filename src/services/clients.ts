import { Client, ClientFormData } from '@/types/client';
import { api } from './api';

export const clientsService = {
  getAll: async (): Promise<Client[]> => {
    return api.get('/clients');
  },

  getById: async (id: string): Promise<Client> => {
    return api.get(`/clients/${id}`);
  },

  create: async (data: ClientFormData): Promise<Client> => {
    return api.post('/clients', data);
  },

  update: async (id: string, data: ClientFormData): Promise<Client> => {
    return api.put(`/clients/${id}`, data);
  },

  delete: async (id: string): Promise<boolean> => {
    return api.delete(`/clients/${id}`);
  },
};
