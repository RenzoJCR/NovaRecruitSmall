import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, RefreshCw, Save, Search } from "lucide-react";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import { areaService } from "../../services/areaService.js";

const initialForm = {
  nombre: "",
  descripcion: "",
};

// FUNCIONES DE VALIDACIÓN CRUDA (Filtro de seguridad en el cliente)
function isOnlyNumbers(value) {
  return /^[0-9\s]+$/.test(value.trim());
}

function hasTextContent(value) {
  const text = value.trim();
  if (!text) return false;
  if (isOnlyNumbers(text)) return false;
  return /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(text);
}

function hasValidAreaName(value) {
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s&+./-]+$/.test(value.trim());
}

function hasValidDescription(value) {
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.;:()&+./-]+$/.test(value.trim());
}

function AdminAreas() {
  // ESTADOS DE MEMORIA (RAM del navegador)
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para alertas controladas
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4500);
  };

  // FUNCIÓN ASÍNCRONA: Carga los datos desde Spring Boot
  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await areaService.getAll();
      setAreas(data); // Inyectamos el JSON de MySQL en el estado
    } catch (error) {
      showMessage(error.userMessage || "No se pudieron recuperar las áreas de MySQL.", "error");
    } finally {
      setLoading(false);
    }
  };

  // TRIGGER AUTOMÁTICO DE ARRANQUE
  useEffect(() => {
    loadAreas();
  }, []);

  // FILTRADO EN MEMORIA (Buscador local en tiempo real)
  const filteredAreas = useMemo(() => {
    const value = search.toLowerCase().trim();
    return areas.filter((area) => 
      area.nombre?.toLowerCase().includes(value) ||
      area.descripcion?.toLowerCase().includes(value)
    );
  }, [areas, search]);

  // CAPTURA DE ESCRITURA EN LOS CAMPOS DE TEXTO
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "nombre" && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s&+./-]*$/.test(value)) return;
    if (name === "descripcion" && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.;:()&+./-]*$/.test(value)) return;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // VALIDACIÓN DE REGLAS DE NEGOCIO ANTES DE VIAJAR POR LA RED
  const validateForm = () => {
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();

    if (!nombre) return "Ingresa el nombre del área técnica.";
    if (nombre.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    if (!hasTextContent(nombre)) return "El nombre debe contener texto válido (no puede ser solo números).";
    if (!hasValidAreaName(nombre)) return "El nombre contiene caracteres o símbolos no permitidos.";

    if (descripcion) {
      if (descripcion.length < 10) return "La descripción debe tener al menos 10 caracteres.";
      if (!hasTextContent(descripcion)) return "La descripción debe contener texto válido.";
      if (!hasValidDescription(descripcion)) return "La descripción contiene caracteres no permitidos.";
    }
    return null;
  };

  // DISPARADOR DE ENVÍO (Mapea al POST del Controller)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
    };

    try {
      setSaving(true);
      // Consumimos el servicio seguro con Axios
      await areaService.create(payload);
      showMessage("Área tecnológica registrada correctamente en MySQL.", "success");
      setForm(initialForm); // Reseteamos las cajas del formulario
      await loadAreas(); // Volvemos a consultar la lista para refrescar la tabla al instante
    } catch (error) {
      showMessage(error.userMessage || "No se pudo registrar el área en el sistema.", "error");
    } finally {
      setSaving(false);
    }
  };

  const alertStyles = {
    info: "bg-sky-50 border-sky-200 text-sky-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    error: "bg-rose-50 border-rose-200 text-rose-700",
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal Modular */}
      <SectionHeader
        title="Áreas Tecnológicas"
        description="Administra las categorías de especialización para clasificar las ofertas de empleo."
      />

      {/* Caja de Alerta Informativa */}
      {message && (
        <div className={`border rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${alertStyles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Tarjeta de Métricas de Control */}
      <section className="max-w-xs bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-slate-500 font-semibold">Total categorías registradas</p>
        <p className="text-3xl font-black text-rose-600 mt-1">{areas.length}</p>
      </section>

      {/* Distribución en Dos Columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        
        {/* LADO IZQUIERDO: TABLA DE DATOS PROVENIENTES DE MYSQL */}
        <main className="space-y-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 shadow-sm">
            {/* Input del Buscador Local */}
            <div className="flex items-center gap-3 border border-slate-300 rounded-xl px-4 py-2.5 bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
              <Search size={18} className="text-rose-600" />
              <input
                type="text"
                placeholder="Filtrar por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none bg-transparent text-sm text-slate-900"
              />
            </div>

            <button
              type="button"
              onClick={loadAreas}
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-black transition-colors cursor-pointer"
            >
              <RefreshCw size={17} />
              Actualizar lista
            </button>
          </section>

          {/* Renderizado Condicional del Listado */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold text-sm shadow-sm animate-pulse">
              Consultando base de datos MySQL de forma segura...
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <Building2 size={40} className="mx-auto text-rose-600" />
              <h2 className="text-lg font-black text-slate-900 mt-3">No se encontraron categorías</h2>
              <p className="text-sm text-slate-500 mt-1">Registra una nueva especialización usando el panel de la derecha.</p>
            </div>
          ) : (
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Encabezado ocultable en móviles */}
              <div className="hidden lg:grid grid-cols-[1fr_2fr] gap-4 px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                <span>Especialidad TI</span>
                <span>Alcance / Descripción</span>
              </div>

              {/* Inyección Dinámica de las Filas de MySQL */}
              <div className="divide-y divide-slate-100">
                {filteredAreas.map((area) => (
                  <div key={area.id} className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-2 lg:gap-4 px-5 py-4 items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase block mb-0.5">Especialidad</span>
                      <p className="font-black text-slate-900 tracking-tight">{area.nombre}</p>
                      <span className="text-[10px] text-slate-400 font-medium">ID Físico: {area.id}</span>
                    </div>
                    <div>
                      <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase block mb-0.5">Descripción</span>
                      <p className="text-sm text-slate-600 leading-relaxed">{area.descripcion || "Sin descripción asignada."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* LADO DERECHO: FORMULARIO FIJO DE CREACIÓN */}
        <aside>
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Nueva categoría</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">Añade un área para clasificar los futuros requerimientos de personal.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Nombre de Especialidad *</label>
                <input
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Desarrollo Backend"
                  maxLength={100}
                  className="input-light text-sm"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Mínimo 3 letras. Evita símbolos inválidos.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Descripción del Perfil</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Describa brevemente qué tecnologías o alcances abarca esta área..."
                  maxLength={255}
                  className="w-full min-h-28 border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm resize-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">Opcional. Si se ingresa, requiere un mínimo de 10 letras.</p>
              </div>

              <button
                type="submit"
                disabled={saving || loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-md shadow-rose-600/10 transition-all cursor-pointer"
              >
                <Save size={16} />
                {saving ? "Registrando en MySQL..." : "Crear nueva área"}
              </button>
            </form>
          </section>
        </aside>

      </div>
    </div>
  );
}

export default AdminAreas;