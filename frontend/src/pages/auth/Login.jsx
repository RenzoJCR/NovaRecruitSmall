import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, LogIn, Mail, Sparkles } from "lucide-react";
import { useAuth } from "../../context/authContext";

const initialForm = {
  correo: "",
  password: "",
};

function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.correo.trim() || !form.password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    try {
      // Intentamos iniciar sesión contra el backend de Spring Boot
      const response = await login(form.correo.trim().toLowerCase(), form.password);
      
      // Redirección inteligente instantánea basada en el rol inmutable de Java
      if (response.rol === "ADMINISTRADOR") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/applicant/dashboard", { replace: true });
      }
    } catch (err) {
      // El api.js atrapa el mensaje de error de Spring Boot y nos lo entrega limpio aquí
      setError(err.userMessage || "Credenciales incorrectas.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white/95 border border-slate-200 rounded-[2rem] p-8 shadow-xl">
          
          {/* Ícono de entrada */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <LogIn size={30} />
          </div>

          <h1 className="text-3xl font-black text-slate-900">Iniciar sesión</h1>
          <p className="text-slate-500 mt-2">Accede a NovaRecruit de forma segura.</p>

          {/* Caja de Alerta de Error */}
          {error && (
            <div className="mt-5 border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Campo de Correo */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Correo</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className="w-full border border-slate-300 rounded-xl py-3 pr-4 pl-12 outline-none bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
              <div className="relative">
                <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  className="w-full border border-slate-300 rounded-xl py-3 pr-4 pl-12 outline-none bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 disabled:from-slate-300 disabled:to-slate-300 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <LogIn size={18} />
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {/* Sección Informativa Reciclada */}
          <div className="mt-6 rounded-3xl bg-emerald-50 border border-emerald-100 p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-emerald-600 shrink-0 mt-1" />
              <p className="text-sm text-slate-600">
                Usa el usuario semilla <strong>admin@novarecruit.com</strong> con la contraseña <strong>admin123</strong> para acceder al panel de control.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="font-black text-emerald-700 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;