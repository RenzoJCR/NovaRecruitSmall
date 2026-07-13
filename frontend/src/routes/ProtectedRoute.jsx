import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  // Consumimos las variables reales de nuestro nuevo AuthContext
  const { isAuthenticated, user } = useAuth();

  // 1. CAPA DE AUTENTICACIÓN: Si no hay token ni usuario, al login de cabeza
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. CAPA DE AUTORIZACIÓN: Si la ruta exige roles y el del usuario no está en la lista
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    // Redirección inteligente según el rol unificado
    if (user.rol === "POSTULANTE") {
      return <Navigate to="/applicant/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // Si pasa todas las capas, renderiza la pantalla solicitada
  return children;
}

export default ProtectedRoute;