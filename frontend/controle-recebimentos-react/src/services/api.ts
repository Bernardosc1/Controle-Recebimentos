import axios from "axios";

// Configuração base do Axios
const api = axios.create({
  baseURL: "http://localhost:8000", // URL do seu backend Django
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor - adiciona token em toda requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config
}, 
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
