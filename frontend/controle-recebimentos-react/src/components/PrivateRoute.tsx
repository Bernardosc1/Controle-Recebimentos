import { Navigate } from 'react-router-dom';


interface PrivateRouteProps {
    children: React.ReactNode;
  }
  
  function PrivateRoute({ children }: PrivateRouteProps) {
    const token = localStorage.getItem('access_token');
  
    // Se não tem token, redireciona para login
    if (!token) {
      return <Navigate to="/login" />;
    }
  
    // Se tem token, mostra o conteúdo da página
    return <>{children}</>;
  }
  
  export default PrivateRoute;