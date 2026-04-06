import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerReservasPorUsuario, obtenerReservas, eliminarReserva } from '../../api/reservas';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/accionesCriticas/ConfirmDialog';

const HistorialReservas = () => {
    const { user, isAdmin } = useAuth();
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [reservaAEliminar, setReservaAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(null);

    useEffect(() => {
        cargarReservas();
    }, []);

    const cargarReservas = async () => {
        try {
            setLoading(true);
            let data;
            
            if (isAdmin()) {
                // Administradores ven todas las reservas
                console.log('🔧 Cargando todas las reservas (administrador)');
                data = await obtenerReservas();
            } else {
                // Usuarios normales ven solo sus reservas
                console.log('👤 Cargando reservas del usuario:', user?.userId);
                data = await obtenerReservasPorUsuario(user?.userId);
            }
            
            setReservas(data || []);
            console.log(`Reservas cargadas y ordenadas: ${data?.length || 0} reservas`);
            setError('');
        } catch (err) {
            setError('Error al cargar las reservas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarReserva = (reserva) => {
        // Preparar datos para el modal de confirmación
        setReservaAEliminar(reserva);
        setShowConfirmDelete(true);
    };

    const confirmarEliminacion = async () => {
        if (!reservaAEliminar) return;

        try {
            setShowConfirmDelete(false);
            setEliminando(reservaAEliminar.id_turno);
            
            // Eliminar de la base de datos
            await eliminarReserva(reservaAEliminar.id_turno);
            
            // Actualizar la lista eliminando la reserva
            setReservas(prev => prev.filter(r => r.id_turno !== reservaAEliminar.id_turno));
            
            alert('Reserva eliminada exitosamente del sistema.');
        } catch (err) {
            console.error('Error al eliminar reserva:', err);
            alert('Error al eliminar la reserva. Por favor, intenta de nuevo.');
        } finally {
            setEliminando(null);
            setReservaAEliminar(null);
        }
    };

    const cancelarEliminacion = () => {
        setShowConfirmDelete(false);
        setReservaAEliminar(null);
    };

    const formatearFechaHora = (fechaHora) => {
        const fecha = new Date(fechaHora);
        return {
            fecha: fecha.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            hora: fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        };
    };

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'reservado': return 'bg-green-100 text-green-800';
            case 'completado': return 'bg-blue-100 text-blue-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const renderDetallesReserva = (reserva, fecha, hora) => (
        <div className={`grid gap-3 sm:gap-4 text-sm text-gray-600 ${isAdmin() ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
            {isAdmin() && (
                <>
                    <div className="min-w-0 text-center sm:text-left">
                        <span className="font-medium">Usuario:</span>
                        <br className="sm:hidden" />
                        <span className="sm:ml-1 break-words">{reserva.nombre || reserva.nombre_usuario || 'Sin nombre'}</span>
                    </div>
                    <div className="min-w-0 col-span-1 sm:col-span-1 lg:col-span-2 xl:col-span-1 text-center sm:text-left">
                        <span className="font-medium">Email:</span>
                        <br className="sm:hidden" />
                        <span className="sm:ml-1 text-xs break-all">{reserva.email || reserva.email_usuario || 'Sin email'}</span>
                    </div>
                </>
            )}
            <div className="text-center sm:text-left">
                <span className="font-medium">Fecha:</span>
                <br className="sm:hidden" />
                <span className="sm:ml-1 capitalize">{fecha}</span>
            </div>
            <div className="text-center sm:text-left">
                <span className="font-medium">Hora:</span>
                <br className="sm:hidden" />
                <span className="sm:ml-1">{hora}</span>
            </div>
            <div className="text-center sm:text-left">
                <span className="font-medium">Duración:</span>
                <br className="sm:hidden" />
                <span className="sm:ml-1">{reserva.duracion} min</span>
            </div>
            <div className="text-center sm:text-left">
                <span className="font-medium">Precio:</span>
                <br className="sm:hidden" />
                <span className="sm:ml-1">${reserva.precio?.toLocaleString()}</span>
            </div>
        </div>
    );

    const filtrarReservas = (tipo) => {
        const ahora = new Date();
        let reservasFiltradas = reservas.filter(reserva => {
            const fechaReserva = new Date(reserva.fecha_turno);
            
            switch (tipo) {
                case 'proximas':
                    return fechaReserva > ahora && reserva.estado === 'reservado';
                case 'pasadas':
                    return fechaReserva <= ahora || reserva.estado === 'completado' || reserva.estado === 'cancelado';
                default:
                    return true;
            }
        });

        // Ordenar por fecha de turno
        return reservasFiltradas.sort((a, b) => {
            const fechaA = new Date(a.fecha_turno);
            const fechaB = new Date(b.fecha_turno);
            
            if (tipo === 'proximas') {
                // Para próximas reservas: más cercanas primero (orden ascendente)
                return fechaA - fechaB;
            } else if (tipo === 'pasadas') {
                // Para reservas pasadas: más recientes primero (orden descendente)
                return fechaB - fechaA;
            } else {
                // Para todas las reservas: más recientes primero
                return fechaB - fechaA;
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="text-lg">Cargando historial de reservas...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto mt-4 sm:mt-8 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold">
                    {isAdmin() ? 'Todas las Reservas' : 'Mis Reservas'}
                    {reservas.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-600">({reservas.length} total)</span>
                    )}
                </h2>
                <div className="flex gap-2">
                    {isAdmin() && (
                        <Link 
                            to="/admin/nueva-reserva"
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm sm:text-base"
                        >
                            Nueva Reserva (Admin)
                        </Link>
                    )}

                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {reservas.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mb-4">
                        <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4M8 7l4 8 4-8m-4 8v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6.5" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes reservas</h3>
                    <p className="text-gray-500 mb-4">¡Haz tu primera reserva ahora!</p>
                    <Link 
                        to="/canchas"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block"
                    >
                        Ver Canchas Disponibles
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Próximas reservas */}
                    {filtrarReservas('proximas').length > 0 && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                                <h3 className="text-lg font-semibold text-green-700">
                                    Próximas Reservas ({filtrarReservas('proximas').length})
                                </h3>
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                                    📅 Ordenadas por fecha (más próximas primero)
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {filtrarReservas('proximas').map((reserva) => {
                                    const { fecha, hora } = formatearFechaHora(reserva.fecha_turno);
                                    return (
                                        <div key={reserva.id_turno} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                            Cancha {reserva.id_cancha}
                                                        </h4>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${obtenerColorEstado(reserva.estado)}`}>
                                                            {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                                                        </span>
                                                    </div>
                                                    
                                                    {renderDetallesReserva(reserva, fecha, hora)}
                                                </div>
                                                
                                                <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
                                                    {isAdmin() && (
                                                        <button
                                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                                eliminando === reserva.id_turno 
                                                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                                                    : 'bg-red-700 hover:bg-red-800 text-white'
                                                            }`}
                                                            onClick={() => handleEliminarReserva(reserva)}
                                                            disabled={eliminando === reserva.id_turno}
                                                        >
                                                            {eliminando === reserva.id_turno ? '⏳ Eliminando...' : 'Eliminar'}
                                                        </button>
                                                    )}
                                                    <span className="text-xs text-gray-500 sm:text-right">
                                                        Reserva #{reserva.id_turno}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Historial (reservas pasadas) */}
                    {filtrarReservas('pasadas').length > 0 && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">
                                    Historial ({filtrarReservas('pasadas').length})
                                </h3>
                                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full w-fit">
                                    📅 Ordenadas por fecha (más recientes primero)
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {filtrarReservas('pasadas').map((reserva) => {
                                    const { fecha, hora } = formatearFechaHora(reserva.fecha_turno);
                                    return (
                                        <div key={reserva.id_turno} className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                                        <h4 className="text-lg font-semibold text-gray-700">
                                                            Cancha {reserva.id_cancha}
                                                        </h4>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${obtenerColorEstado(reserva.estado)}`}>
                                                            {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                                                        </span>
                                                    </div>
                                                    
                                                    {renderDetallesReserva(reserva, fecha, hora)}
                                                </div>
                                                
                                                <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
                                                    {isAdmin() && (
                                                        <button
                                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                                eliminando === reserva.id_turno 
                                                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                                                    : 'bg-red-700 hover:bg-red-800 text-white'
                                                            }`}
                                                            onClick={() => handleEliminarReserva(reserva)}
                                                            disabled={eliminando === reserva.id_turno}
                                                        >
                                                            {eliminando === reserva.id_turno ? '⏳ Eliminando...' : 'Eliminar'}
                                                        </button>
                                                    )}
                                                    <span className="text-xs text-gray-400 sm:text-right">
                                                        Reserva #{reserva.id_turno}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Confirmación para Eliminar Reserva */}
            {showConfirmDelete && reservaAEliminar && (
                <ConfirmDialog 
                    isOpen={showConfirmDelete}
                    onConfirm={confirmarEliminacion}
                    onCancel={cancelarEliminacion}
                    title="⚠️ Eliminar Reserva Definitivamente"
                    message={
                        <div className="space-y-4">
                            <div className="border-l-4 border-red-500 pl-4">
                                <h4 className="font-semibold text-red-800 mb-3">
                                    ¿Estás seguro de eliminar esta reserva del sistema?
                                </h4>
                                
                                {/* Información de la reserva */}
                                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                    <h5 className="font-medium text-gray-800 mb-2">Detalles de la Reserva:</h5>
                                    <div className="space-y-1 text-sm text-gray-700">
                                        <p><span className="font-medium">ID:</span> {reservaAEliminar.id_turno}</p>
                                        <p><span className="font-medium">Cancha:</span> Cancha {reservaAEliminar.id_cancha}</p>
                                        <p><span className="font-medium">Usuario:</span> {reservaAEliminar.nombre || reservaAEliminar.nombre_usuario || `ID: ${reservaAEliminar.id_usuario}`}</p>
                                        <p><span className="font-medium">Email:</span> {reservaAEliminar.email || reservaAEliminar.email_usuario}</p>
                                        <p><span className="font-medium">Fecha:</span> {(() => {
                                            const { fecha, hora } = formatearFechaHora(reservaAEliminar.fecha_turno);
                                            return `${fecha} a las ${hora}`;
                                        })()}</p>
                                        <p><span className="font-medium">Estado:</span> {reservaAEliminar.estado}</p>
                                        <p><span className="font-medium">Precio:</span> ${reservaAEliminar.precio?.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Advertencias */}
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <p className="font-medium text-red-800 mb-2">⚠️ Esta acción es IRREVERSIBLE</p>
                                    <ul className="space-y-1 text-sm text-red-700">
                                        <li>• La reserva será eliminada permanentemente del sistema</li>
                                        <li>• Se perderá todo el historial asociado</li>
                                        <li>• El usuario será notificado automáticamente por email</li>
                                        <li>• El horario quedará disponible para nuevas reservas</li>
                                        <li>• No se puede deshacer esta operación</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="text-center pt-2">
                                <p className="text-sm font-medium text-gray-800">
                                    Solo los administradores pueden realizar esta acción crítica
                                </p>
                            </div>
                        </div>
                    }
                    confirmText="Sí, Eliminar Definitivamente"
                    cancelText="Cancelar"
                    type="danger"
                />
            )}
        </div>
    );
};

export default HistorialReservas;