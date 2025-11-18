import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
    baseURL: 'http://localhost:8000',  // URL do seu backend Django
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  export default api;