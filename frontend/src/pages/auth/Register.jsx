import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, LockKeyhole, UserPlus, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/authContext";

const initialForm = {
  nombres: "",
  apellidos: "",
  correo: "",
  password: "",
};

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validación básica en el cliente
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.correo.trim() || !form.password.trim()) {
      setError("Por favor, completa todos los campos del formulario.");
      return;
    }

    try {
      // Disparamos los datos reales hacia el AuthController de Spring Boot
      await register(
        form.nombres.trim(),
        form.apellidos.trim(),
        form.correo.trim().toLowerCase(),
        form.password
      );
      
      setSuccess(true);
      // Esperamos 2 segundos para que el usuario vea el mensaje de éxito y lo redirigimos
      setTimeout(() => {
        navigate("/applicant/dashboard", { replace: true });
      }, 2000);

    } catch (err) {
      // Atrapamos el mensaje de error controlado de Java (ej: "El correo ya existe")
      setError(err.userMessage || "Ocurrió un error al intentar registrar la cuenta.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        
        {/* Botón superior para regresar al Login de forma amigable */}
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver al inicio de sesión
        </Link>

        <div className="bg-white/95 border border-slate-200 rounded-[2rem] p-8 shadow-xl">
          
          {/* Ícono de registro */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <UserPlus size={30} />
          </div>

          <h1 className="text-3xl font-black text-slate-900">Crear cuenta</h1>
          <p className="text-slate-500 mt-2">Regístrate como postulante en NovaRecruit.</p>

          {/* Caja de Alerta de Error */}
          {error && (
            <div className="mt-5 border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Caja de Alerta de Éxito */}
          {success && (
            <div className="mt-5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-semibold">
              ¡Cuenta registrada con éxito! Redirigiendo...
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            
            {/* Fila doble: Nombres y Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombres</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="text"
                    name="nombres"
                    value={form.nombres}
                    onChange={handleChange}
                    placeholder="Juan"
                    className="w-full border border-slate-300 rounded-xl py-2.5 pr-4 pl-11 outline-none bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Apellidos</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="text"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    placeholder="Pérez"
                    className="w-full border border-slate-300 rounded-xl py-2.5 pr-4 pl-11 outline-none bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Campo de Correo */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="juan.perez@ejemplo.com"
                  className="w-full border border-slate-300 rounded-xl py-2.5 pr-4 pl-11 outline-none bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-sm"
                />
              </div>
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-slate-300 rounded-xl py-2.5 pr-4 pl-11 outline-none bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-sm"
                />
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 disabled:from-slate-300 disabled:to-slate-300 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all cursor-pointer mt-2 text-sm"
            >
              <UserPlus size={16} />
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="font-black text-emerald-700 hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;