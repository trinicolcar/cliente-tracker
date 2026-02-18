const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const buildError = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (data?.error && typeof data.error === 'string') {
      return new Error(data.error);
    }
    if (data?.message && typeof data.message === 'string') {
      return new Error(data.message);
    }
  } catch {
    // ignore parse errors
  }
  return new Error(fallback);
};

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      throw await buildError(response, `Failed to fetch ${endpoint}`);
    }
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw await buildError(response, `Failed to post to ${endpoint}`);
    }
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw await buildError(response, `Failed to update ${endpoint}`);
    }
    return response.json();
  },

  patch: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw await buildError(response, `Failed to patch ${endpoint}`);
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw await buildError(response, `Failed to delete ${endpoint}`);
    }
    return response.ok;
  },
};
