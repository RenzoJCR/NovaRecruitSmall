/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "novarecruit_token";
const USER_KEY = "novarecruit_user";

function cargarUsuarioGuardado() {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    const id = parsedUser.id ?? parsedUser.userId;

    if (!id || !parsedUser.rol) {
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return { ...parsedUser, id };
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function construirUsuario(data) {
  return {
    id: data.userId,
    nombres: data.nombres,
    apellidos: data.apellidos,
    correo: data.correo,
    rol: data.rol,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(cargarUsuarioGuardado);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    const cerrarSesionPorTokenInvalido = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener(
      "novarecruit:unauthorized",
      cerrarSesionPorTokenInvalido,
    );

    return () => {
      window.removeEventListener(
        "novarecruit:unauthorized",
        cerrarSesionPorTokenInvalido,
      );
    };
  }, []);

  const loginExecute = async (correo, password) => {
    setLoading(true);
    try {
      const data = await authService.login(correo, password);
      setToken(data.token);
      setUser(construirUsuario(data));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const registerExecute = async (nombres, apellidos, correo, password) => {
    setLoading(true);
    try {
      const data = await authService.register(
        nombres,
        apellidos,
        correo,
        password,
      );
      setToken(data.token);
      setUser(construirUsuario(data));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logoutExecute = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user?.id && user?.rol),
    login: loginExecute,
    register: registerExecute,
    logout: logoutExecute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
}
