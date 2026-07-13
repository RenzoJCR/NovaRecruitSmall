import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderCog, Briefcase, Users, UserCheck, LogOut, BriefcaseBusiness } from "lucide-react";
import { useAuth } from "../../context/authContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // 1. Definimos los botones del menú para el ADMINISTRADOR
  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/areas", label: "Áreas Técnicas", icon: <FolderCog size={20} /> },
    { to: "/admin/vacantes", label: "Vacantes", icon: <Briefcase size={20} /> },
    { to: "/admin/usuarios", label: "Control de Usuarios", icon: <Users size={20} /> },
    { to: "/admin/postulaciones", label: "Pipeline RRHH", icon: <UserCheck size={20} /> },
  ];

  // 2. Definimos los botones del menú para el POSTULANTE
  const applicantLinks = [
    { to: "/applicant/dashboard", label: "Mis Postulaciones", icon: <BriefcaseBusiness size={20} /> },
    { to: "/applicant/vacantes", label: "Explorar Vacantes", icon: <Briefcase size={20} /> },
  ];

  // Seleccionamos las opciones correctas según el rol verificado del JWT
  const links = user?.rol === "ADMINISTRADOR" ? adminLinks : applicantLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800">
      {/* Encabezado del Menú */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-black">
          NR
        </div>
        <span className="font-black text-xl tracking-wider text-white">NovaRecruit</span>
      </div>

      {/* Perfil del Usuario Conectado */}
      <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-800/50 border border-slate-800">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Usuario actual</p>
        <p className="text-sm font-bold text-white mt-1 truncate">{user?.nombres}</p>
        <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black mt-1">
          {user?.rol}
        </span>
      </div>

      {/* Listado Dinámico de Enlaces */}
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-linear-to-r from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Botón Inferior de Cierre de Sesión */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;