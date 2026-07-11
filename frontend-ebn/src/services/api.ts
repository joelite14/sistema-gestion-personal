// frontend/src/services/api.ts
import axios from 'axios';

// 🔥 Obtener la URL base según el entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 📦 Configurar axios con la URL base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  //withCredentials: true, // Para enviar cookies/session
});

// Cliente para peticiones Fetch (si no usas axios)
export const API_BASE_URL = API_URL;

// ⚡ Función helper para peticiones fetch
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
};