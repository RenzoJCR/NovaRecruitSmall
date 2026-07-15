import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Building2,
  RefreshCw,
  Save,
  Search,
  Pencil,
  X,
  Power,
  FilterX,
} from "lucide-react";

import SectionHeader from
  "../../components/ui/SectionHeader.jsx";

import {
  areaService,
} from "../../services/areaService.js";

const initialForm = {
  nombre: "",
  descripcion: "",
};

function isOnlyNumbers(value) {
  return /^[0-9\s]+$/.test(
    value.trim()
  );
}

function hasTextContent(value) {
  const text = value.trim();

  if (!text) {
    return false;
  }

  if (isOnlyNumbers(text)) {
    return false;
  }

  return /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(
    text
  );
}

function hasValidAreaName(value) {
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s&+./-]+$/.test(
    value.trim()
  );
}

function hasValidDescription(value) {
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.;:()&+./-]+$/.test(
    value.trim()
  );
}

function AdminAreas() {
  const [areas, setAreas] =
    useState([]);

  const [form, setForm] =
    useState(initialForm);

  const [search, setSearch] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("TODAS");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState(null);

  const [editingId, setEditingId] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  const formPanelRef = useRef(null);

  const showMessage = (
    text,
    type = "info"
  ) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4500);
  };

  const loadAreas = async () => {
    try {
      setLoading(true);

      const data =
        await areaService.getAll();

      setAreas(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      showMessage(
        error.userMessage ||
          "No se pudieron recuperar las áreas de MySQL.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const filteredAreas =
    useMemo(() => {
      const value =
        search
          .toLowerCase()
          .trim();

      return areas.filter((area) => {
        const estaActiva =
          area.activo !== false;

        const coincideTexto =
          value === "" ||
          (area.nombre || "")
            .toLowerCase()
            .includes(value) ||
          (area.descripcion || "")
            .toLowerCase()
            .includes(value);

        const coincideEstado =
          filtroEstado === "TODAS" ||
          (
            filtroEstado ===
              "ACTIVAS" &&
            estaActiva
          ) ||
          (
            filtroEstado ===
              "INACTIVAS" &&
            !estaActiva
          );

        return (
          coincideTexto &&
          coincideEstado
        );
      });
    }, [
      areas,
      search,
      filtroEstado,
    ]);

  const totalActivas =
    useMemo(
      () =>
        areas.filter(
          (area) =>
            area.activo !== false
        ).length,
      [areas]
    );

  const totalInactivas =
    areas.length - totalActivas;

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    if (
      name === "nombre" &&
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s&+./-]*$/.test(
        value
      )
    ) {
      return;
    }

    if (
      name === "descripcion" &&
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.;:()&+./-]*$/.test(
        value
      )
    ) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const nombre =
      form.nombre.trim();

    const descripcion =
      form.descripcion.trim();

    if (!nombre) {
      return "Ingresa el nombre del área técnica.";
    }

    if (nombre.length < 3) {
      return "El nombre debe tener al menos 3 caracteres.";
    }

    if (
      !hasTextContent(nombre)
    ) {
      return "El nombre debe contener texto válido y no puede ser solo números.";
    }

    if (
      !hasValidAreaName(nombre)
    ) {
      return "El nombre contiene caracteres o símbolos no permitidos.";
    }

    if (descripcion) {
      if (
        descripcion.length < 10
      ) {
        return "La descripción debe tener al menos 10 caracteres.";
      }

      if (
        !hasTextContent(
          descripcion
        )
      ) {
        return "La descripción debe contener texto válido.";
      }

      if (
        !hasValidDescription(
          descripcion
        )
      ) {
        return "La descripción contiene caracteres no permitidos.";
      }
    }

    return null;
  };

  const iniciarEdicion = (area) => {
    setEditingId(area.id);

    setForm({
      nombre:
        area.nombre || "",
      descripcion:
        area.descripcion || "",
    });

    setMessage("");

    setTimeout(() => {
      formPanelRef.current
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 0);
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const limpiarFiltros = () => {
    setSearch("");
    setFiltroEstado("TODAS");
  };

  const handleToggleEstado =
    async (area) => {
      const estaActiva =
        area.activo !== false;

      const nuevoEstado =
        !estaActiva;

      const accion =
        nuevoEstado
          ? "activar"
          : "desactivar";

      const confirmado =
        window.confirm(
          `¿Deseas ${accion} el área "${area.nombre}"?`
        );

      if (!confirmado) {
        return;
      }

      try {
        setUpdatingStatusId(
          area.id
        );

        const actualizada =
          await areaService
            .changeStatus(
              area.id,
              nuevoEstado
            );

        setAreas((prev) =>
          prev.map((item) =>
            item.id === area.id
              ? actualizada
              : item
          )
        );

        showMessage(
          nuevoEstado
            ? "Área tecnológica activada correctamente."
            : "Área tecnológica desactivada. Ya no estará disponible para nuevas vacantes.",
          "success"
        );
      } catch (error) {
        showMessage(
          error.userMessage ||
            "No se pudo cambiar el estado del área.",
          "error"
        );
      } finally {
        setUpdatingStatusId(null);
      }
    };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      showMessage(
        validationError,
        "error"
      );

      return;
    }

    const payload = {
      nombre:
        form.nombre.trim(),

      descripcion:
        form.descripcion.trim() ||
        null,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await areaService.update(
          editingId,
          payload
        );

        showMessage(
          "Área tecnológica actualizada correctamente.",
          "success"
        );
      } else {
        await areaService.create(
          payload
        );

        showMessage(
          "Área tecnológica registrada correctamente en MySQL.",
          "success"
        );
      }

      setEditingId(null);
      setForm(initialForm);

      await loadAreas();
    } catch (error) {
      showMessage(
        error.userMessage ||
          (
            editingId !== null
              ? "No se pudo actualizar el área."
              : "No se pudo registrar el área."
          ),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const alertStyles = {
    info:
      "bg-sky-50 border-sky-200 text-sky-700",

    success:
      "bg-emerald-50 border-emerald-200 text-emerald-700",

    error:
      "bg-rose-50 border-rose-200 text-rose-700",
  };

  const filtrosActivos =
    search.trim() !== "" ||
    filtroEstado !== "TODAS";

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Áreas Tecnológicas"
        description="Administra, edita y controla la disponibilidad de las categorías utilizadas en las vacantes."
      />

      {message && (
        <div
          className={`border rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${alertStyles[messageType]}`}
        >
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold">
            Total de áreas
          </p>

          <p className="text-3xl font-black text-slate-900 mt-1">
            {areas.length}
          </p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-emerald-700 font-semibold">
            Áreas activas
          </p>

          <p className="text-3xl font-black text-emerald-600 mt-1">
            {totalActivas}
          </p>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-rose-700 font-semibold">
            Áreas inactivas
          </p>

          <p className="text-3xl font-black text-rose-600 mt-1">
            {totalInactivas}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <main className="space-y-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto_auto] gap-3">
              <div className="flex items-center gap-3 border border-slate-300 rounded-xl px-4 py-2.5 bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                <Search
                  size={18}
                  className="text-rose-600"
                />

                <input
                  type="text"
                  placeholder="Filtrar por nombre o descripción..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  className="w-full outline-none bg-transparent text-sm text-slate-900"
                />
              </div>

              <select
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value
                  )
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm font-bold text-slate-700 outline-none focus:border-rose-500"
              >
                <option value="TODAS">
                  Todas las áreas
                </option>

                <option value="ACTIVAS">
                  Solo activas
                </option>

                <option value="INACTIVAS">
                  Solo inactivas
                </option>
              </select>

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={!filtrosActivos}
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 px-3 py-2.5 rounded-xl text-xs font-black cursor-pointer"
              >
                <FilterX size={16} />
                Limpiar
              </button>

              <button
                type="button"
                onClick={loadAreas}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-black transition-colors cursor-pointer"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Actualizar
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Mostrando{" "}
              {filteredAreas.length} de{" "}
              {areas.length} áreas.
            </p>
          </section>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold text-sm shadow-sm animate-pulse">
              Consultando base de datos
              MySQL...
            </div>
          ) : filteredAreas.length ===
            0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <Building2
                size={40}
                className="mx-auto text-rose-600"
              />

              <h2 className="text-lg font-black text-slate-900 mt-3">
                No se encontraron áreas
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Cambia los filtros o registra
                una nueva especialización.
              </p>
            </div>
          ) : (
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="hidden lg:grid grid-cols-[1fr_2fr_110px_190px] gap-4 px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                <span>
                  Especialidad TI
                </span>

                <span>
                  Alcance / Descripción
                </span>

                <span>
                  Estado
                </span>

                <span className="text-right">
                  Acciones
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredAreas.map(
                  (area) => {
                    const estaActiva =
                      area.activo !== false;

                    return (
                      <div
                        key={area.id}
                        className={`grid grid-cols-1 lg:grid-cols-[1fr_2fr_110px_190px] gap-3 lg:gap-4 px-5 py-4 items-center transition-colors ${
                          editingId ===
                          area.id
                            ? "bg-rose-50/60"
                            : estaActiva
                              ? "hover:bg-slate-50/50"
                              : "bg-slate-50/70 opacity-75"
                        }`}
                      >
                        <div>
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase block mb-0.5">
                            Especialidad
                          </span>

                          <p className="font-black text-slate-900 tracking-tight">
                            {area.nombre}
                          </p>

                          <span className="text-[10px] text-slate-400 font-medium">
                            ID físico: {area.id}
                          </span>
                        </div>

                        <div>
                          <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase block mb-0.5">
                            Descripción
                          </span>

                          <p className="text-sm text-slate-600 leading-relaxed">
                            {area.descripcion ||
                              "Sin descripción asignada."}
                          </p>
                        </div>

                        <div>
                          <span
                            className={`inline-flex border px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              estaActiva
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-slate-100 border-slate-300 text-slate-500"
                            }`}
                          >
                            {estaActiva
                              ? "Activa"
                              : "Inactiva"}
                          </span>
                        </div>

                        <div className="flex flex-wrap lg:justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              iniciarEdicion(
                                area
                              )
                            }
                            disabled={
                              saving ||
                              updatingStatusId !==
                                null
                            }
                            className="inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:border-rose-300 hover:text-rose-600 disabled:opacity-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleEstado(
                                area
                              )
                            }
                            disabled={
                              updatingStatusId !==
                                null ||
                              saving
                            }
                            className={`inline-flex items-center justify-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer disabled:opacity-50 ${
                              estaActiva
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            <Power size={14} />

                            {updatingStatusId ===
                            area.id
                              ? "Actualizando..."
                              : estaActiva
                                ? "Desactivar"
                                : "Activar"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </main>

        <aside ref={formPanelRef}>
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingId !== null
                    ? "Editar categoría"
                    : "Nueva categoría"}
                </h2>

                <p className="text-sm text-slate-500 mt-1 mb-5">
                  {editingId !== null
                    ? "Modifica el nombre o la descripción del área seleccionada."
                    : "Añade un área para clasificar los futuros requerimientos de personal."}
                </p>
              </div>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  disabled={saving}
                  className="inline-flex items-center justify-center w-9 h-9 border border-slate-300 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
                  title="Cancelar edición"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            {editingId !== null && (
              <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                Editando el área con ID{" "}
                {editingId}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Nombre de especialidad *
                </label>

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

                <p className="text-[10px] text-slate-400 mt-1">
                  Mínimo 3 caracteres. Evita
                  símbolos inválidos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Descripción del perfil
                </label>

                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Describe brevemente las tecnologías o alcances de esta área..."
                  maxLength={255}
                  className="w-full min-h-28 border border-slate-300 rounded-xl p-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm resize-none transition-all"
                />

                <p className="text-[10px] text-slate-400 mt-1">
                  Opcional. Si se ingresa,
                  requiere un mínimo de 10
                  caracteres.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  loading
                }
                className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-md shadow-rose-600/10 transition-all cursor-pointer"
              >
                <Save size={16} />

                {saving
                  ? editingId !== null
                    ? "Guardando cambios..."
                    : "Registrando en MySQL..."
                  : editingId !== null
                    ? "Guardar cambios"
                    : "Crear nueva área"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-black transition-colors cursor-pointer"
                >
                  <X size={16} />
                  Cancelar edición
                </button>
              )}
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default AdminAreas;