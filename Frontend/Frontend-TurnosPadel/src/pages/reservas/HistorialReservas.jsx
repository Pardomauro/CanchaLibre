import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerReservasPorUsuario, obtenerReservas, eliminarReserva, confirmarReserva, completarReserva } from '../../api/reservas';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/accionesCriticas/ConfirmDialog';

const HistorialReservas = () => {
    const { user, isAdmin } = useAuth();
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConfirmApprove, setShowConfirmApprove] = useState(false);
    const [reservaAEliminar, setReservaAEliminar] = useState(null);
    const [reservaAConfirmar, setReservaAConfirmar] = useState(null);
    const [eliminando, setEliminando] = useState(null);
    const [confirmando, setConfirmando] = useState(null);
    const [reservaCompletada, setReservaCompletada] = useState(null);

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

    const handleConfirmarReserva = (reserva) => {
        setReservaAConfirmar(reserva);
        setShowConfirmApprove(true);
    };

    const handleReservaCompletada = async (reserva) => {
        try {
            setReservaCompletada(reserva.id_turno);
            const respuesta = await completarReserva(reserva.id_turno);
            console.log('Reserva Completada: ', respuesta);
            
            // Actualizar el estado local de la reserva
            setReservas(prev => prev.map(r => (
                r.id_turno === reserva.id_turno
                    ? { ...r, estado: 'completado' }
                    : r
            )));
            
            alert('✅ Reserva marcada como completada exitosamente.');
        } catch (err) {
            console.error('Error al completar reserva:', err);
            alert('Error al completar la reserva. Por favor, intenta de nuevo.');
        } finally {
            setReservaCompletada(null);
        }
    }

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

    const confirmarAprobacion = async () => {
        if (!reservaAConfirmar) return;

        try {
            setShowConfirmApprove(false);
            setConfirmando(reservaAConfirmar.id_turno);

            const respuesta = await confirmarReserva(reservaAConfirmar.id_turno);

            console.log('Respuesta actualizarReserva:', respuesta);

            setReservas(prev => prev.map(r => (
                r.id_turno === reservaAConfirmar.id_turno
                    ? { ...r, estado: 'reservado' }
                    : r
            )));

            alert(respuesta?.mensaje || 'Reserva confirmada exitosamente. Se envió el correo al usuario.');
        } catch (err) {
            console.error('Error al confirmar reserva:', err);
            alert('Error al confirmar la reserva. Por favor, intenta de nuevo.');
        } finally {
            setConfirmando(null);
            setReservaAConfirmar(null);
        }
    };

    const cancelarAprobacion = () => {
        setShowConfirmApprove(false);
        setReservaAConfirmar(null);
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
            case 'pendiente de pago': return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'reservado': return 'bg-[#588157] text-white border border-[#3A5A40]';
            case 'completado': return 'bg-[#A3B18A] text-white border border-[#588157]';
            case 'cancelado': return 'bg-rose-100 text-rose-800 border border-rose-200';
            default: return 'bg-slate-100 text-slate-800 border border-slate-200';
        }
    };

    const renderDetallesReserva = (reserva, fecha, hora, celular) => (
        <>
            {/* Vista móvil optimizada */}
            <div className="block sm:hidden space-y-3">
                {isAdmin() && (
                    <div className="bg-gradient-to-r from-[#DAD7CD]/20 to-[#A3B18A]/20 rounded-lg p-3 border border-[#588157]/10">
                        <div className="flex items-start gap-2 mb-2">
                            <span className="text-lg">👤</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-[#588157]/70 uppercase tracking-wide">Usuario</div>
                                <div className="text-sm font-bold text-[#3A5A40] break-words">{reserva.nombre || reserva.nombre_usuario || 'Sin nombre'}</div>
                                <div className="text-xs text-[#3A5A40]/70 break-all mt-0.5">{reserva.email || reserva.email_usuario || 'Sin email'}</div>
                                <div className="text-xs text-[#3A5A40]/70 break-all mt-0.5">{reserva.celular || reserva.celular_usuario || 'Sin celular'}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-[#588157]/5 to-[#3A5A40]/5 rounded-lg p-3 border border-[#588157]/10">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">🎾</span>
                            <span className="text-xs font-semibold text-[#588157]/70 uppercase tracking-wide">Tipo de Cancha</span>
                        </div>
                        <div className="text-sm font-bold text-[#3A5A40] capitalize leading-tight">{reserva.tipo_cancha || 'No especificado'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#588157]/5 to-[#3A5A40]/5 rounded-lg p-3 border border-[#588157]/10">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">📅</span>
                            <span className="text-xs font-semibold text-[#588157]/70 uppercase tracking-wide">Fecha</span>
                        </div>
                        <div className="text-sm font-bold text-[#3A5A40] capitalize leading-tight">{fecha}</div>
                    </div>

                    <div className="bg-gradient-to-br from-[#588157]/5 to-[#3A5A40]/5 rounded-lg p-3 border border-[#588157]/10">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">🕐</span>
                            <span className="text-xs font-semibold text-[#588157]/70 uppercase tracking-wide">Hora</span>
                        </div>
                        <div className="text-sm font-bold text-[#3A5A40] leading-tight">{hora}</div>
                    </div>

                    <div className="bg-gradient-to-br from-[#588157]/5 to-[#3A5A40]/5 rounded-lg p-3 border border-[#588157]/10">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">⏱️</span>
                            <span className="text-xs font-semibold text-[#588157]/70 uppercase tracking-wide">Duración</span>
                        </div>
                        <div className="text-sm font-bold text-[#3A5A40] leading-tight">{reserva.duracion} min</div>
                    </div>

                    <div className="bg-gradient-to-br from-[#A3B18A]/10 to-[#588157]/10 rounded-lg p-3 border border-[#588157]/20">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">💰</span>
                            <span className="text-xs font-semibold text-[#588157]/70 uppercase tracking-wide">Precio</span>
                        </div>
                        <div className="text-base font-extrabold text-[#588157] leading-tight">${reserva.precio?.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Vista desktop/tablet */}
            <div className={`hidden sm:grid gap-3 sm:gap-4 text-sm text-[#3A5A40] ${isAdmin() ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {isAdmin() && (
                    <>
                        <div className="min-w-0">
                            <span className="font-medium">Usuario:</span>
                            <span className="ml-1 break-words">{reserva.nombre || reserva.nombre_usuario || 'Sin nombre'}</span>
                        </div>
                        <div className="min-w-0 col-span-1 lg:col-span-2 xl:col-span-1">
                            <span className="font-medium">Email:</span>
                            <span className="ml-1 text-xs break-all">{reserva.email || reserva.email_usuario || 'Sin email'}</span>
                        </div>
                        <div className="min-w-0 col-span-1 lg:col-span-2 xl:col-span-1">
                            <span className="font-medium">Celular:</span>
                            <span className="ml-1 text-xs break-all">{reserva.celular || reserva.celular_usuario || 'Sin celular'}</span>
                        </div>
                    </>
                )}
                <div>
                    <span className="font-medium">Tipo de Cancha:</span>
                    <span className="ml-1 capitalize">{reserva.tipo_cancha || 'No especificado'}</span>
                </div>
                <div>
                    <span className="font-medium">Fecha:</span>
                    <span className="ml-1 capitalize">{fecha}</span>
                </div>
                <div>
                    <span className="font-medium">Hora:</span>
                    <span className="ml-1">{hora}</span>
                </div>
                <div>
                    <span className="font-medium">Duración:</span>
                    <span className="ml-1">{reserva.duracion} min</span>
                </div>
                <div>
                    <span className="font-medium">Precio:</span>
                    <span className="ml-1">${reserva.precio?.toLocaleString()}</span>
                </div>
            </div>
        </>
    );

    const filtrarReservas = (tipo) => {
        const ahora = new Date();
        let reservasFiltradas = reservas.filter(reserva => {
            const fechaReserva = new Date(reserva.fecha_turno);

            switch (tipo) {
                case 'proximas':
                    return fechaReserva > ahora && ['pendiente de pago', 'reservado'].includes(reserva.estado);
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
            <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] flex justify-center items-center">
                <div className="text-lg text-[#3A5A40] animate-pulse font-medium">Cargando historial de reservas...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A]">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10 pb-8 sm:pb-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                        {isAdmin() ? 'Todas las Reservas' : 'Mis Reservas'}
                        {reservas.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-[#3A5A40]">({reservas.length} total)</span>
                        )}
                    </h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {isAdmin() && (
                            <Link
                                to="/admin/nueva-reserva"
                                className="flex-1 sm:flex-none text-center bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base font-medium"
                            >
                                + Nueva Reserva
                            </Link>
                        )}

                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 px-4 py-3 rounded-lg mb-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-sm sm:text-base">{error}</span>
                        </div>
                    </div>
                )}

                {reservas.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 bg-white rounded-2xl shadow-xl">
                        <div className="mb-4">
                            <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-[#A3B18A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4M8 7l4 8 4-8m-4 8v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6.5" />
                            </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent mb-2">No tienes reservas</h3>
                        <p className="text-[#3A5A40] mb-6 text-sm sm:text-base px-4">¡Haz tu primera reserva ahora!</p>
                        <Link
                            to="/canchas"
                            className="bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl inline-block font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                        >
                            🎾 Ver Canchas Disponibles
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Próximas reservas */}
                        {filtrarReservas('proximas').length > 0 && (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                                    <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                        🎾 Próximas Reservas ({filtrarReservas('proximas').length})
                                    </h3>
                                    <span className="text-xs font-medium text-[#3A5A40] bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full w-fit border border-[#588157]/20 shadow-sm">
                                        📅 Ordenadas por fecha
                                    </span>
                                </div>
                                <div className="grid gap-3 sm:gap-4">
                                    {filtrarReservas('proximas').map((reserva) => {
                                        const { fecha, hora } = formatearFechaHora(reserva.fecha_turno);
                                        return (
                                            <div key={reserva.id_turno} className="bg-white border-2 border-[#588157]/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                                {/* Header del card */}
                                                <div className="bg-gradient-to-r from-[#588157]/10 to-[#3A5A40]/10 px-4 py-3 sm:px-6 sm:py-4 border-b border-[#588157]/20">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                                                🎾 Cancha {reserva.id_cancha}
                                                            </h4>
                                                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${obtenerColorEstado(reserva.estado)}`}>
                                                                {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                                                            </span>
                                                        </div>

                                                        <span className="text-xs text-[#588157]/60 font-semibold">
                                                            ID #{reserva.id_turno}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Contenido del card */}
                                                <div className="p-4 sm:p-6">
                                                    {renderDetallesReserva(reserva, fecha, hora)}

                                                    {/* Botones de acción (solo admin) */}
                                                    {isAdmin() && (
                                                        <div className="mt-4 pt-4 border-t border-[#588157]/10">
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                {reserva.estado === 'pendiente de pago' && (
                                                                    <button
                                                                        className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${confirmando === reserva.id_turno
                                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg active:scale-95'
                                                                            }`}
                                                                        onClick={() => handleConfirmarReserva(reserva)}
                                                                        disabled={confirmando === reserva.id_turno}
                                                                    >
                                                                        {confirmando === reserva.id_turno ? '⏳ Confirmando...' : '✅ Confirmar Reserva'}
                                                                    </button>
                                                                )}
                                                                {reserva.estado === 'reservado' && new Date(reserva.fecha_turno) <= new Date() && (
                                                                    <button
                                                                        className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${reservaCompletada === reserva.id_turno
                                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                            : 'bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white shadow-md hover:shadow-lg active:scale-95'
                                                                            }`}
                                                                        onClick={() => handleReservaCompletada(reserva)}
                                                                        disabled={reservaCompletada === reserva.id_turno}
                                                                    >
                                                                        {reservaCompletada === reserva.id_turno ? '⏳ Completando...' : '✓ Marcar como Completada'}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${eliminando === reserva.id_turno
                                                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md hover:shadow-lg active:scale-95'
                                                                        }`}
                                                                    onClick={() => handleEliminarReserva(reserva)}
                                                                    disabled={eliminando === reserva.id_turno}
                                                                >
                                                                    {eliminando === reserva.id_turno ? '⏳ Eliminando...' : '🗑️ Eliminar Reserva'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
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
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                                    <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                        📚 Historial ({filtrarReservas('pasadas').length})
                                    </h3>
                                    <span className="text-xs font-medium text-[#3A5A40] bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full w-fit border border-[#588157]/20 shadow-sm">
                                        📅 Más recientes primero
                                    </span>
                                </div>
                                <div className="grid gap-3 sm:gap-4">
                                    {filtrarReservas('pasadas').map((reserva) => {
                                        const { fecha, hora } = formatearFechaHora(reserva.fecha_turno);
                                        return (
                                            <div key={reserva.id_turno} className="bg-white/90 border border-slate-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 opacity-90 overflow-hidden">
                                                {/* Header del card */}
                                                <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-lg sm:text-xl font-bold text-[#3A5A40]">
                                                                Cancha {reserva.id_cancha}
                                                            </h4>
                                                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${obtenerColorEstado(reserva.estado)}`}>
                                                                {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-[#588157]/40 font-semibold">
                                                            ID #{reserva.id_turno}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Contenido del card */}
                                                <div className="p-4 sm:p-6">
                                                    {renderDetallesReserva(reserva, fecha, hora)}

                                                    {/* Botones de acción (solo admin) */}
                                                    {isAdmin() && (
                                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                {reserva.estado === 'pendiente de pago' && (
                                                                    <button
                                                                        className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${confirmando === reserva.id_turno
                                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg active:scale-95'
                                                                            }`}
                                                                        onClick={() => handleConfirmarReserva(reserva)}
                                                                        disabled={confirmando === reserva.id_turno}
                                                                    >
                                                                        {confirmando === reserva.id_turno ? '⏳ Confirmando...' : '✅ Confirmar Reserva'}
                                                                    </button>
                                                                )}
                                                                {reserva.estado === 'reservado' && new Date(reserva.fecha_turno) <= new Date() && (
                                                                    <button
                                                                        className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${reservaCompletada === reserva.id_turno
                                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                            : 'bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white shadow-md hover:shadow-lg active:scale-95'
                                                                            }`}
                                                                        onClick={() => handleReservaCompletada(reserva)}
                                                                        disabled={reservaCompletada === reserva.id_turno}
                                                                    >
                                                                        {reservaCompletada === reserva.id_turno ? '⏳ Completando...' : '✓ Marcar como Completada'}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${eliminando === reserva.id_turno
                                                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md hover:shadow-lg active:scale-95'
                                                                        }`}
                                                                    onClick={() => handleEliminarReserva(reserva)}
                                                                    disabled={eliminando === reserva.id_turno}
                                                                >
                                                                    {eliminando === reserva.id_turno ? '⏳ Eliminando...' : '🗑️ Eliminar Reserva'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
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
                                <div className="border-l-4 border-rose-500 pl-4">
                                    <h4 className="font-semibold text-rose-800 mb-3">
                                        ¿Estás seguro de eliminar esta reserva del sistema?
                                    </h4>

                                    {/* Información de la reserva */}
                                    <div className="bg-[#DAD7CD]/30 p-3 rounded-lg mb-3 border border-[#A3B18A]/30">
                                        <h5 className="font-medium text-[#3A5A40] mb-2">Detalles de la Reserva:</h5>
                                        <div className="space-y-1 text-sm text-[#3A5A40]/80">
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
                                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                                        <p className="font-medium text-rose-800 mb-2">⚠️ Esta acción es IRREVERSIBLE</p>
                                        <ul className="space-y-1 text-sm text-rose-700">
                                            <li>• La reserva será eliminada permanentemente del sistema</li>
                                            <li>• Se perderá todo el historial asociado</li>
                                            <li>• El usuario será notificado automáticamente por email</li>
                                            <li>• El horario quedará disponible para nuevas reservas</li>
                                            <li>• No se puede deshacer esta operación</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center pt-2">
                                    <p className="text-sm font-medium text-[#3A5A40]">
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

                {/* Modal de Confirmación para Aprobar Reserva */}
                {showConfirmApprove && reservaAConfirmar && (
                    <ConfirmDialog
                        isOpen={showConfirmApprove}
                        onConfirm={confirmarAprobacion}
                        onCancel={cancelarAprobacion}
                        title="✅ Confirmar Reserva"
                        message={
                            <div className="space-y-4">
                                <div className="border-l-4 border-amber-500 pl-4">
                                    <h4 className="font-semibold text-amber-800 mb-3">
                                        ¿Querés confirmar esta reserva y enviar el correo al usuario?
                                    </h4>
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm space-y-1 text-amber-900">
                                        <p><span className="font-medium">ID:</span> {reservaAConfirmar.id_turno}</p>
                                        <p><span className="font-medium">Cancha:</span> Cancha {reservaAConfirmar.id_cancha}</p>
                                        <p><span className="font-medium">Estado actual:</span> {reservaAConfirmar.estado}</p>
                                    </div>
                                </div>
                            </div>
                        }
                        confirmText="Sí, Confirmar y Enviar Mail"
                        cancelText="Cancelar"
                        type="warning"
                    />
                )}
            </div>
        </div>
    );
};

export default HistorialReservas;