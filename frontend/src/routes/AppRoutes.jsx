import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/layouts/DashboardLayout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Home from "../pages/public/Home";
import PublicJobDetail from "../pages/public/PublicJobDetail";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminAreas from "../pages/admin/AdminAreas";
import AdminVacantes from "../pages/admin/AdminVacantes";
import AdminPostulaciones from "../pages/admin/AdminPostulaciones";
import AdminUsuarios from "../pages/admin/AdminUsuarios"; // Importación nueva

import ApplicantDashboard from "../pages/applicant/ApplicantDashboard";
import ApplicantVacantes from "../pages/applicant/ApplicantVacantes"; // Importación nueva
import RendirExamen from "../pages/applicant/RendirExamen";

function AppRoutes() {
  return (
    <Routes>
      {/* 1. RUTAS PÚBLICAS */}
      <Route path="/" element={<Home />} />
      <Route path="/vacantes/:id" element={<PublicJobDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 2. RUTAS DEL POSTULANTE */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["POSTULANTE"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />
        <Route path="/applicant/vacantes" element={<ApplicantVacantes />} />
        <Route path="/applicant/examen/:id" element={<RendirExamen />} />
      </Route>

      {/* 3. RUTAS DEL ADMINISTRADOR */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/areas" element={<AdminAreas />} />
        <Route path="/admin/vacantes" element={<AdminVacantes />} />
        <Route path="/admin/usuarios" element={<AdminUsuarios />} />
        <Route path="/admin/postulaciones" element={<AdminPostulaciones />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;