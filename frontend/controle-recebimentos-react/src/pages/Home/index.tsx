import "./style.css";
import Trash from "../../assets/icons8-trash-25.svg";
import { useState } from "react";
import { Link } from 'react-router-dom';


import api from '../../services/api';

function Home() {
  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [userType, setUserType] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede reload da página

    // TODO: Validar se as senhas conferem
    if (password !== confirmPassword) {
      alert("As senhas não conferem!");
      return;
    }

    // Montar objeto para enviar à API
    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
      user_type: userType,
    };

    try {
      const response = await api.post('/register/', userData);

      console.log('Usuario cirado: ', response.data);
      alert('Usuario cadastrado com sucesso!')
    } catch(error){
      console.error('Erro ao cadastrar usuário: ', error)
      alert('Erro ao cadastrar usuário. Verifique os dados!')
    }

    console.log("Dados a enviar:", userData);
    // No próximo passo vamos chamar a API aqui!
  };

  return (
    <>
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Cadastro de Usuários</h1>
          <input
            placeholder="Primeiro nome"
            type="text"
            name="first_name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            placeholder="Último nome"
            type="text"
            name="last_name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
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
          <input
            placeholder="Confirme a senha"
            type="password"
            name="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <select
            name="user_type"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          >
            <option value="">Selecione...</option>
            <option value="DIR">Diretor</option>
            <option value="GES">Gestor</option>
          </select>
          <p className="logar">Já tem uma conta? <Link to="/login">Faça login</Link></p>

          <button type="submit">Cadastrar</button>
        </form>

        <div>
          <div>
            <p>Nome: </p>
            <p>Idade: </p>
            <p>Email: </p>
          </div>
          <button>
            <img src={Trash} />
          </button>
        </div>
      </div>
    </>
  );
}

export default Home;
