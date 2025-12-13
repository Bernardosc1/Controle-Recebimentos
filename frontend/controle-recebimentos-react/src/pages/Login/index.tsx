import "./style.css";
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';


import api from '../../services/api';

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede reload da página
    try {
      const response = await api.post('/token/', {
        email: email,
        password: password
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      navigate('/dashboard')
    } catch(error){
      console.error('Erro ao fazer login: ', error);
      alert('Erro ao fazer login. Verifique suas credenciais!');
    }
    // No próximo passo vamos chamar a API aqui!
  };

  return (
    <>
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Login</h1>
          <input
            placeholder="E-mail"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Senha"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="registrar">Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link></p>
          <button type="submit">Login</button>
        </form>
      </div>
    </>
  );
}

export default Login;
