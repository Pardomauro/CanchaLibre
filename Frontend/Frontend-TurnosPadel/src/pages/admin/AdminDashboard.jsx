import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerEstadisticas } from '../../api/estadisticas';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [estadisticas, setEstadisticas] = useState({
        canchasActivas: 0,
        reservasHoy: 0,
        usuariosRegistrados: 0,
        ingresosMes: 0,
        reservasMes: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await obtenerEstadisticas(user?.token);
            if (response.success) {
                setEstadisticas(response.data);
            } else {
                setError('Error al cargar estadísticas');
            }
        } catch (err) {
            console.error('Error cargando estadísticas:', err);
            if (err?.status === 401) {
                setError('Sesión expirada o no autorizada. Volvé a iniciar sesión.');
                logout();
                navigate('/login', { replace: true });
            } else {
                setError(err?.message || 'Error al conectar con el servidor');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A]">
            <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
                <div className="mb-6 sm:mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent mb-2">Dashboard Administrativo</h1>
                    <p className="text-sm sm:text-base text-gray-700 mt-2">Bienvenido, {user?.role === 'admin' ? 'Usuario' : 'Administrador'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {/* Gestión de Canchas */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col h-full hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-3 rounded-xl shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 ml-3">Gestión de Canchas</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 flex-grow">Administrar canchas, horarios y mantenimiento</p>
                        <div className="space-y-2 mt-auto">
                            <Link to="/canchas" className="block w-full bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-2.5 px-4 rounded-lg transition-all duration-200 text-center text-sm font-semibold shadow-md hover:shadow-lg">
                                Ver Canchas
                            </Link>
                            <Link to="/canchas/crear" className="block w-full bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-2.5 px-4 rounded-lg transition-all duration-200 text-center text-sm font-semibold shadow-md hover:shadow-lg">
                                Crear Cancha
                            </Link>
                        </div>
                    </div>

                    {/* Gestión de Reservas */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col h-full hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-3 rounded-xl shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 ml-3">Gestión de Reservas</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 flex-grow">Administrar reservas y turnos</p>
                        <div className="space-y-2 mt-auto">
                            <Link to="/reservas/historial" className="block w-full bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-2.5 px-4 rounded-lg transition-all duration-200 text-center text-sm font-semibold shadow-md hover:shadow-lg">
                                Ver Historial
                            </Link>
                            <Link to="/admin/nueva-reserva" className="block w-full bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-2.5 px-4 rounded-lg transition-all duration-200 text-center text-sm font-semibold shadow-md hover:shadow-lg">
                                Nueva Reserva
                            </Link>
                        </div>
                    </div>

                    {/* Gestión de Usuarios */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col h-full hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-3 rounded-xl shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 ml-3">Gestión de Usuarios</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 flex-grow">Administrar usuarios del sistema</p>
                        <div className="space-y-2 mt-auto">
                            <Link to="/admin/usuarios" className="block w-full bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-2.5 px-4 rounded-lg transition-all duration-200 text-center text-sm font-semibold shadow-md hover:shadow-lg">
                                Gestionar Usuarios
                            </Link>
                            {/* Botón placeholder para mantener altura uniforme */}
                            <div className="block w-full py-2.5 px-4 rounded-lg text-center text-sm font-semibold opacity-0 pointer-events-none">
                                Placeholder
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="mt-6 sm:mt-8 bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
                        <h3 className="text-xl font-bold text-gray-800">Estadísticas Rápidas</h3>
                        <button
                            onClick={cargarEstadisticas}
                            className="text-[#588157] hover:text-[#3A5A40] transition-colors text-sm flex items-center font-semibold"
                            disabled={loading}
                        >
                            <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loading ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start">
                            <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center bg-gradient-to-br from-[#588157] to-[#3A5A40] p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {loading ? '...' : estadisticas.canchasActivas}
                            </div>
                            <div className="text-sm text-white/90 font-medium mt-1">Canchas Activas</div>
                            <div className="text-xs text-white/70 mt-1">Sin mantenimiento</div>
                        </div>
                        <div className="text-center bg-gradient-to-br from-[#588157] to-[#3A5A40] p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {loading ? '...' : estadisticas.reservasHoy}
                            </div>
                            <div className="text-sm text-white/90 font-medium mt-1">Reservas Hoy</div>
                            <div className="text-xs text-white/70 mt-1">
                                {new Date().toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </div>
                        </div>
                        <div className="text-center bg-gradient-to-br from-[#588157] to-[#3A5A40] p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {loading ? '...' : estadisticas.usuariosRegistrados}
                            </div>
                            <div className="text-sm text-white/90 font-medium mt-1">Usuarios Registrados</div>
                            <div className="text-xs text-white/70 mt-1">Total del sistema</div>
                        </div>
                        <div className="text-center bg-gradient-to-br from-[#588157] to-[#3A5A40] p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                                {loading ? '...' : `$${estadisticas.ingresosMes.toLocaleString()}`}
                            </div>
                            <div className="text-sm text-white/90 font-medium mt-1">Ingresos del Mes</div>
                            <div className="text-xs text-white/70 mt-1">
                                {new Date().toLocaleDateString('es-ES', {
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Estado del sistema */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-5">Estado del Sistema</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#DAD7CD]/30 to-transparent rounded-lg">
                                <span className="text-sm text-gray-700 font-medium">Canchas disponibles</span>
                                <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 bg-[#588157] rounded-full mr-2 animate-pulse"></div>
                                    <span className="text-sm font-bold text-[#3A5A40]">{estadisticas.canchasActivas} activas</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#A3B18A]/30 to-transparent rounded-lg">
                                <span className="text-sm text-gray-700 font-medium">Actividad hoy</span>
                                <div className="flex items-center">
                                    <div className={`w-2.5 h-2.5 rounded-full mr-2 ${estadisticas.reservasHoy > 0 ? 'bg-[#588157] animate-pulse' : 'bg-gray-400'}`}></div>
                                    <span className="text-sm font-bold text-[#3A5A40]">
                                        {estadisticas.reservasHoy > 0 ? 'Activo' : 'Sin reservas'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#588157]/20 to-transparent rounded-lg">
                                <span className="text-sm text-gray-700 font-medium">Base de usuarios</span>
                                <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 bg-[#3A5A40] rounded-full mr-2"></div>
                                    <span className="text-sm font-bold text-[#344E41]">{estadisticas.usuariosRegistrados} usuarios</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumen financiero */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-5">Resumen Financiero</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#588157]/10 to-[#A3B18A]/10 rounded-lg">
                                <span className="text-sm text-gray-700 font-medium">Ingresos del mes</span>
                                <span className="text-xl font-bold text-[#588157]">
                                    ${estadisticas.ingresosMes.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700 font-medium">Promedio por reserva</span>
                                <span className="text-sm font-bold text-[#3A5A40]">
                                    ${estadisticas.reservasMes > 0 ?
                                        Math.round(estadisticas.ingresosMes / estadisticas.reservasMes).toLocaleString() :
                                        '0'
                                    }
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-600 font-medium">Meta mensual</span>
                                    <span className="text-xs text-[#588157] font-semibold">
                                        {Math.min((estadisticas.ingresosMes / 50000) * 100, 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#588157] to-[#3A5A40] h-3 rounded-full transition-all duration-500 shadow-md"
                                        style={{ width: `${Math.min((estadisticas.ingresosMes / 50000) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accesos rápidos adicionales */}
                <div className="mt-6 sm:mt-8 bg-gradient-to-r from-[#588157] to-[#3A5A40] rounded-2xl shadow-xl p-6 text-white">
                    <h4 className="text-xl font-bold mb-5">Accesos Rápidos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link
                            to="/reservas/historial"
                            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <div className="font-semibold text-base">Ver Reportes</div>
                                    <div className="text-sm text-white/80">Historial completo</div>
                                </div>
                            </div>
                        </Link>
                        <Link
                            to="/admin/nueva-reserva"
                            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <div className="font-semibold text-base">Nueva Reserva</div>
                                    <div className="text-sm text-white/80">Crear reserva rápida</div>
                                </div>
                            </div>
                        </Link>
                        <Link
                            to="/canchas/crear"
                            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <div className="font-semibold text-base">Nueva Cancha</div>
                                    <div className="text-sm text-white/80">Configurar cancha</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;