import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicializamos los estados leyendo el disco del navegador (localStorage)
  const [token, setToken] = useState(() => localStorage.getItem("novarecruit_token"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("novarecruit_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  // Cada vez que el token cambie, lo actualizamos en el almacenamiento local
  useEffect(() => {
    if (token) {
      localStorage.setItem("novarecruit_token", token);
    } else {
      localStorage.removeItem("novarecruit_token");
    }
  }, [token]);

  // Cada vez que el usuario cambie, actualizamos sus datos en formato texto string JSON
  useEffect(() => {
    if (user) {
      localStorage.setItem("novarecruit_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("novarecruit_user");
    }
  }, [user]);

  // Función lógica de Login que llamará el formulario de la pantalla
  const loginExecute = async (correo, password) => {
    setLoading(true);
    try {
      const data = await authService.login(correo, password);
      // Al recibir el DTO ideal de Java, guardamos el token y los datos del perfil
      setToken(data.token);
      setUser({
        id: data.id,
        nombres: data.nombres,
        correo: data.correo,
        rol: data.rol // 'ADMINISTRADOR' o 'POSTULANTE'
      });
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Función lógica para registrarse
  const registerExecute = async (nombres, apellidos, correo, password) => {
    setLoading(true);
    try {
      const data = await authService.register(nombres, apellidos, correo, password);
      setToken(data.token);
      setUser({
        id: data.id,
        nombres: data.nombres,
        correo: data.correo,
        rol: data.rol
      });
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Cierre de sesión asíncrono (Stateless puro)
  const logoutExecute = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("novarecruit_token");
    localStorage.removeItem("novarecruit_user");
  };

  // Exponemos las variables y funciones para que cualquier componente las consuma
  const value = {
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    login: loginExecute,
    register: registerExecute,
    logout: logoutExecute
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Gancho (Hook) utilitario para usar el contexto con una sola línea de código
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
}