import React, { useEffect, useState, useMemo } from 'react';
import { Users, Search, RefreshCw, Save, UserPlus, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import { usuarioService } from '../../services/usuarioService';

const initialForm = { nombres: '', apellidos: '', correo: '', password: '', rol: 'POSTULANTE' };

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.listarTodos();
      setUsuarios(data);
    } catch (err) {
      showMessage(err.userMessage || 'Error al conectar con MySQL para leer usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const filteredUsuarios = useMemo(() => {
    const value = search.toLowerCase().trim();
    return usuarios.filter(u => 
      u.nombreCompleto?.toLowerCase().includes(value) || 
      u.correo?.toLowerCase().includes(value)
    );
  }, [usuarios, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInit = (u) => {
    setEditingId(u.id);
    setForm({ nombres: u.nombres, apellidos: u.apellidos, correo: u.correo, password: '', rol: u.rol });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.correo.trim()) {
      showMessage('Completa todos los campos obligatorios.', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await usuarioService.actualizar(editingId, form);
        showMessage('Usuario actualizado con éxito.', 'success');
      } else {
        if (!form.password.trim()) {
          showMessage('La contraseña es obligatoria para nuevos registros.', 'error');
          return;
        }
        await usuarioService.crear(form);
        showMessage('Nuevo usuario registrado en MySQL.', 'success');
      }
      setForm(initialForm);
      setEditingId(null);
      await cargarUsuarios();
    } catch (err) {
      showMessage(err.userMessage || 'Ocurrió un error en la persistencia.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (id, actualmenteActivo) => {
    try {
      if (actualmenteActivo) {
        await usuarioService.desactivar(id);
        showMessage('Cuenta de usuario suspendida (Borrado Lógico).', 'info');
      } else {
        await usuarioService.reactivar(id);
        showMessage('Acceso de usuario restablecido con éxito.', 'success');
      }
      await cargarUsuarios();
    } catch (err) {
      showMessage('No se pudo alterar el estado del usuario.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Control Global de Usuarios" description="Administra accesos corporativos, credenciales y audita postulantes registrados." />

      {message && (
        <div className={`border p-3 rounded-xl text-sm font-semibold ${
          messageType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
          messageType === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-sky-50 border-sky-200 text-sky-700'
        }`}>{message}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <main className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-sm">
            <div className="flex-1 flex items-center gap-2 border border-slate-300 rounded-xl px-4 bg-white focus-within:border-slate-900 transition-all">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Buscar por nombre o correo electrónico..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full py-2.5 text-sm outline-none bg-transparent text-slate-900" />
            </div>
            <button onClick={cargarUsuarios} className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 px-4 rounded-xl text-sm font-bold text-slate-700"><RefreshCw size={16} /></button>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium animate-pulse">Sincronizando cuentas con MySQL...</div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">No se encontraron usuarios en los registros.</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Usuario</th>
                    <th className="px-6 py-3.5 text-left">Correo</th>
                    <th className="px-6 py-3.5 text-left">Rol</th>
                    <th className="px-6 py-3.5 text-center">Estado</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {filteredUsuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{u.nombreCompleto}</td>
                      <td className="px-6 py-4 text-slate-600">{u.correo}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border ${u.rol === 'ADMINISTRADOR' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{u.rol}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleEstado(u.id, u.activo)} className="focus:outline-none">
                          {u.activo ? <ToggleRight className="text-emerald-500" size={28} /> : <ToggleLeft className="text-slate-400" size={28} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEditInit(u)} className="text-xs font-bold border border-slate-300 hover:border-slate-900 px-2.5 py-1.5 rounded-lg transition-colors">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <aside className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">{editingId ? 'Editar Perfil' : 'Nuevo Usuario'}</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">{editingId ? 'Modifica los privilegios de la cuenta seleccionada.' : 'Registra personal interno o cuentas de prueba.'}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombres *</label>
              <input type="text" name="nombres" value={form.nombres} onChange={handleChange} className="input-light text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Apellidos *</label>
              <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} className="input-light text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Correo Electrónico *</label>
              <input type="email" name="correo" value={form.correo} onChange={handleChange} className="input-light text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contraseña {editingId && '(Dejar vacío para mantener)'}</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="input-light text-sm" placeholder={editingId ? "••••••••" : "Clave segura"} required={!editingId} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Rol asignado</label>
              <select name="rol" value={form.rol} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-sm font-bold text-slate-800">
                <option value="POSTULANTE">Postulante</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              {editingId && <button type="button" onClick={handleCancelEdit} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-50">Cancelar</button>}
              <button type="submit" disabled={saving} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold">{saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Cuenta'}</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}