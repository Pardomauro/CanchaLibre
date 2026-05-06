import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import Unauthorized from '../auth/Unauthorized';

// Páginas de usuario
import Login from '../../pages/usuario/login';
import Registro from '../../pages/usuario/registro';
import RecuperarPassword from '../../pages/usuario/RecuperarPassword';
import Perfil from '../../pages/usuario/perfil';

// Páginas de admin
import AdminDashboard from '../../pages/admin/AdminDashboard';
import GestionUsuarios from '../../pages/admin/GestionUsuarios';

// Páginas de canchas
import ListaCanchas from '../../pages/canchas/lista';
import DetalleCancha from '../../pages/canchas/detalle';
import CrearEditarCancha from '../../pages/canchas/CrearEditar';

// Páginas de reservas
import HistorialReservas from '../../pages/reservas/HistorialReservas';
import NuevaReserva from '../../pages/reservas/NuevaReserva';

// Wrapper para extraer el parámetro id de la URL
function NuevaReservaWrapper() {
    const { id } = useParams();
    return <NuevaReserva canchaId={id} redirectPath="/reservas/historial" />;
}

export default function RutasApp() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Cargando...</div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Redirigir la raíz según autenticación */}
            <Route path="/" element={
                isAuthenticated() ? <Navigate to="/canchas" replace /> : <Navigate to="/login" replace />
            } />
            
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Rutas Protegidas para Usuarios */}
            <Route path="/canchas" element={
                <ProtectedRoute>
                    <ListaCanchas />
                </ProtectedRoute>
            } />
            <Route path="/canchas/:id" element={
                <ProtectedRoute>
                    <DetalleCancha />
                </ProtectedRoute>
            } />
            
            {/* Rutas Protegidas para Admin */}
            <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/canchas/crear" element={
                <ProtectedRoute requireAdmin={true}>
                    <CrearEditarCancha />
                </ProtectedRoute>
            } />
            <Route path="/canchas/editar/:id" element={
                <ProtectedRoute requireAdmin={true}>
                    <CrearEditarCancha />
                </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
                <ProtectedRoute requireAdmin={true}>
                    <GestionUsuarios />
                </ProtectedRoute>
            } />
            <Route path="/admin/nueva-reserva" element={
                <ProtectedRoute requireAdmin={true}>
                    <NuevaReserva isAdmin={true} redirectPath="/admin" />
                </ProtectedRoute>
            } />

            {/* Rutas de Reservas */}
            <Route path="/reservas/historial" element={
                <ProtectedRoute>
                    <HistorialReservas />
                </ProtectedRoute>
            } />
            <Route path="/reservar/:id" element={
                <ProtectedRoute>
                    <NuevaReservaWrapper />
                </ProtectedRoute>
            } />

            {/* Ruta de Perfil de Usuario */}
            <Route path="/perfil" element={
                <ProtectedRoute>
                    <Perfil />
                </ProtectedRoute>
            } />

            {/* Ruta 404 - No encontrado */}
            <Route path="*" element={
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold text-gray-700">Página no encontrada</h2>
                    <p className="text-gray-600 mt-2">La página que buscas no existe.</p>
                </div>
            } />
        </Routes>
    );
}