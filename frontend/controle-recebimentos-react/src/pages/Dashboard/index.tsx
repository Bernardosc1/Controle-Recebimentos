import { useNavigate } from 'react-router-dom';

function Dashboard() {

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login')
        };
    return (
      <div>
        <header><button onClick={handleLogout}>Logout</button></header>
        <h1>Dashboard</h1>
        <p>Bem-vindo ao sistema!</p>
        <p>Você está logado.</p>
      </div>
    );
  }
  
  export default Dashboard;