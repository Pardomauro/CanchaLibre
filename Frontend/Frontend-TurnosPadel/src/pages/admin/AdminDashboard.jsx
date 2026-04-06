import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerEstadisticas } from '../../api/estadisticas';

const AdminDashboard = () => {
    const { user } = useAuth();
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
            const response = await obtenerEstadisticas();
            if (response.success) {
                setEstadisticas(response.data);
            } else {
                setError('Error al cargar estadísticas');
            }
        } catch (err) {
            console.error('Error cargando estadísticas:', err);
            setError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
            <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard Administrativo</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Bienvenido, {user?.role === 'admin' ? 'Usuario' : 'Administrador'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Gestión de Canchas */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col h-full">
                    <div className="flex items-center mb-3 sm:mb-4">
                        <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                            </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 ml-3">Gestión de Canchas</h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 flex-grow">Administrar canchas, horarios y mantenimiento</p>
                    <div className="space-y-2 mt-auto">
                        <Link to="/canchas" className="block w-full bg-blue-700 text-white py-2 sm:py-2 px-3 sm:px-4 rounded hover:bg-blue-600 transition-colors text-center text-sm sm:text-base">
                            Ver Canchas
                        </Link>
                        <Link to="/canchas/crear" className="block w-full bg-green-700 text-white py-2 sm:py-2 px-3 sm:px-4 rounded hover:bg-green-600 transition-colors text-center text-sm sm:text-base">
                            Crear Cancha
                        </Link>
                    </div>
                </div>

                {/* Gestión de Reservas */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col h-full">
                    <div className="flex items-center mb-3 sm:mb-4">
                        <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 ml-3">Gestión de Reservas</h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 flex-grow">Administrar reservas y turnos</p>
                    <div className="space-y-2 mt-auto">
                        <Link to="/reservas/historial" className="block w-full bg-blue-700 text-white py-2 sm:py-2 px-3 sm:px-4 rounded hover:bg-blue-600 transition-colors text-center text-sm sm:text-base">
                            Ver Historial
                        </Link>
                        <Link to="/admin/nueva-reserva" className="block w-full bg-green-700 text-white py-2 sm:py-2 px-3 sm:px-4 rounded hover:bg-green-600 transition-colors text-center text-sm sm:text-base">
                            Nueva Reserva
                        </Link>
                    </div>
                </div>

                {/* Gestión de Usuarios */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col h-full">
                    <div className="flex items-center mb-3 sm:mb-4">
                        <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 ml-3">Gestión de Usuarios</h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 flex-grow">Administrar usuarios del sistema</p>
                    <div className="space-y-2 mt-auto">
                        <Link to="/admin/usuarios" className="block w-full bg-purple-700 text-white py-2 sm:py-2 px-3 sm:px-4 rounded hover:bg-purple-600 transition-colors text-center text-sm sm:text-base">
                            Gestionar Usuarios
                        </Link>
                        {/* Botón placeholder para mantener altura uniforme */}
                        <div className="block w-full py-2 sm:py-2 px-3 sm:px-4 rounded text-center text-sm sm:text-base opacity-0 pointer-events-none">
                            Placeholder
                        </div>
                    </div>
                </div>
            </div>

                {/* Estadísticas rápidas */}
            <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">Estadísticas Rápidas</h3>
                    <button
                        onClick={cargarEstadisticas}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm flex items-center"
                        disabled={loading}
                    >
                        <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {loading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                            {loading ? '...' : estadisticas.canchasActivas}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Canchas Activas</div>
                        <div className="text-xs text-green-600 mt-1 hidden sm:block">Sin mantenimiento</div>
                    </div>
                    <div className="text-center bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                            {loading ? '...' : estadisticas.reservasHoy}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Reservas Hoy</div>
                        <div className="text-xs text-blue-600 mt-1 hidden sm:block">
                            {new Date().toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short' 
                            })}
                        </div>
                    </div>
                    <div className="text-center bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                            {loading ? '...' : estadisticas.usuariosRegistrados}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Usuarios Registrados</div>
                        <div className="text-xs text-purple-600 mt-1 hidden sm:block">Total del sistema</div>
                    </div>
                    <div className="text-center bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                            {loading ? '...' : `$${estadisticas.ingresosMes.toLocaleString()}`}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Ingresos del Mes</div>
                        <div className="text-xs text-yellow-600 mt-1 hidden sm:block">
                            {new Date().toLocaleDateString('es-ES', { 
                                month: 'long', 
                                year: 'numeric' 
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Estado del sistema */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Estado del Sistema</h4>
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-600">Canchas disponibles</span>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 sm:mr-2"></div>
                                <span className="text-xs sm:text-sm font-medium">{estadisticas.canchasActivas} activas</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-600">Actividad hoy</span>
                            <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-1.5 sm:mr-2 ${estadisticas.reservasHoy > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                <span className="text-xs sm:text-sm font-medium">
                                    {estadisticas.reservasHoy > 0 ? 'Activo' : 'Sin reservas'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-600">Base de usuarios</span>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-1.5 sm:mr-2"></div>
                                <span className="text-xs sm:text-sm font-medium">{estadisticas.usuariosRegistrados} usuarios</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen financiero */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Resumen Financiero</h4>
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-600">Ingresos del mes</span>
                            <span className="text-sm sm:text-lg font-bold text-green-600">
                                ${estadisticas.ingresosMes.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-600">Promedio por reserva</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-800">
                                ${estadisticas.reservasMes > 0 ? 
                                    Math.round(estadisticas.ingresosMes / estadisticas.reservasMes).toLocaleString() : 
                                    '0'
                                }
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                            <div 
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((estadisticas.ingresosMes / 50000) * 100, 100)}%` }}
                            ></div>
                        </div>
                        
                    </div>
                </div>
            </div>

            {/* Accesos rápidos adicionales */}
            <div className="mt-6 sm:mt-8 bg-blue-800 rounded-lg shadow-md p-4 sm:p-6 text-white">
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Accesos Rápidos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Link 
                        to="/reservas/historial" 
                        className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 sm:p-4 hover:bg-opacity-30 transition-all duration-200"
                    >
                        <div className="flex items-center">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div>
                                <div className="font-medium text-sm sm:text-base">Ver Reportes</div>
                                <div className="text-xs sm:text-sm opacity-80">Historial completo</div>
                            </div>
                        </div>
                    </Link>
                    <Link 
                        to="/admin/nueva-reserva" 
                        className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 sm:p-4 hover:bg-opacity-30 transition-all duration-200"
                    >
                        <div className="flex items-center">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <div>
                                <div className="font-medium text-sm sm:text-base">Nueva Reserva</div>
                                <div className="text-xs sm:text-sm opacity-80">Crear reserva rápida</div>
                            </div>
                        </div>
                    </Link>
                    <Link 
                        to="/canchas/crear" 
                        className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 sm:p-4 hover:bg-opacity-30 transition-all duration-200"
                    >
                        <div className="flex items-center">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                            </svg>
                            <div>
                                <div className="font-medium text-sm sm:text-base">Nueva Cancha</div>
                                <div className="text-xs sm:text-sm opacity-80">Configurar cancha</div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;