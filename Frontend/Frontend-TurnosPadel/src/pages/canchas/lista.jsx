import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerCanchas, eliminarCancha } from '../../api/canchas';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/accionesCriticas/ConfirmDialog';

// Función helper para manejar horarios de forma segura
const getHorariosCount = (horarios) => {
    try {
        if (!horarios) return 0;
        if (Array.isArray(horarios)) return horarios.length;
        if (typeof horarios === 'string') {
            const parsed = JSON.parse(horarios);
            return Array.isArray(parsed) ? parsed.length : 0;
        }
        return 0;
    } catch (error) {
        console.warn('Error parsing horarios:', error);
        return 0;
    }
};

export default function ListaCanchas() {
    const [canchas, setCanchas] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [eliminando, setEliminando] = useState(null); // ID de la cancha que se está eliminando
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [canchaAEliminar, setCanchaAEliminar] = useState(null);
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        cargarCanchas();
    }, []);

    const cargarCanchas = async () => {
        try {
            const canchasData = await obtenerCanchas();
            console.log('Canchas obtenidas:', canchasData); // Para debug
            
            setCanchas(Array.isArray(canchasData) ? canchasData : []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las canchas');
            console.error(err);
            setCanchas([]); // Asegurar que siempre sea un array
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarCancha = async (id, numero) => {
        // Guardar datos de la cancha a eliminar y mostrar modal
        setCanchaAEliminar({ id, numero });
        setShowConfirmDelete(true);
    };

    const confirmarEliminacion = async () => {
        if (!canchaAEliminar) return;

        try {
            setShowConfirmDelete(false);
            setEliminando(canchaAEliminar.id); // Marcar como eliminando
            await eliminarCancha(canchaAEliminar.id);
            await cargarCanchas(); // Recargar la lista
            alert('Cancha eliminada exitosamente');
        } catch (err) {
            console.error('Error al eliminar cancha:', err);
            alert('Error al eliminar la cancha. Por favor, intenta de nuevo.');
        } finally {
            setEliminando(null); // Quitar el estado de carga
            setCanchaAEliminar(null); // Limpiar datos
        }
    };

    const cancelarEliminacion = () => {
        setShowConfirmDelete(false);
        setCanchaAEliminar(null);
    };

    if (loading) {
        return <div className="text-center py-4">Cargando canchas...</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center py-4">{error}</div>;
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-12">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                Canchas Disponibles
                            </h1>
                            <p className="mt-2 text-sm sm:text-base text-gray-600">
                                Encuentra y reserva tu espacio deportivo
                            </p>
                        </div>
                        {isAdmin() && (
                            <Link 
                                to="/canchas/crear" 
                                className="bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">+ Nueva Cancha</span>
                                <span className="sm:hidden">+ Cancha</span>
                            </Link>
                        )}
                    </div>
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.isArray(canchas) && canchas.length > 0 ? canchas.map((cancha) => (
                    <div 
                        key={cancha.id_cancha} 
                        className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                Cancha {cancha.id_cancha}
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${!cancha.en_mantenimiento ? 'bg-[#588157]' : 'bg-red-500'} shadow-sm`}></div>
                            </div>
                        </div>
                        
                        <div className="space-y-3 mb-5">
                            <div className="bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg p-3">
                                <p className="text-gray-700 text-sm sm:text-base">
                                    <span className="font-semibold text-[#3A5A40]">Precio:</span>
                                    <span className="ml-2 text-lg font-bold text-[#588157]">${cancha.precio?.toLocaleString()}</span>
                                </p>
                            </div>
                            <div className={`flex items-center gap-2 text-sm sm:text-base font-medium ${!cancha.en_mantenimiento ? 'text-[#588157]' : 'text-red-600'}`}>
                                {!cancha.en_mantenimiento ? (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Disponible</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span>En Mantenimiento</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <svg className="w-4 h-4 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{Array.isArray(cancha.horarios_disponibles) ? cancha.horarios_disponibles.length : getHorariosCount(cancha.horarios_disponibles)} horarios disponibles</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                            <Link 
                                to={`/canchas/${cancha.id_cancha}`}
                                className="text-[#588157] hover:text-[#3A5A40] text-sm sm:text-base font-semibold transition-colors duration-200 flex items-center gap-1"
                            >
                                <span>Ver detalles</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            
                            {isAdmin() ? (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <Link 
                                        to={`/canchas/editar/${cancha.id_cancha}`}
                                        className="text-[#588157] hover:text-[#3A5A40] text-sm font-semibold transition-colors duration-200 text-center flex items-center justify-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span>Editar</span>
                                    </Link>
                                    <button
                                        onClick={() => handleEliminarCancha(cancha.id_cancha, cancha.id_cancha)}
                                        disabled={eliminando === cancha.id_cancha}
                                        className={`text-sm font-semibold transition-colors duration-200 text-center flex items-center justify-center gap-1 ${
                                            eliminando === cancha.id_cancha 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-red-500 hover:text-red-700'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>{eliminando === cancha.id_cancha ? 'Eliminando...' : 'Eliminar'}</span>
                                    </button>
                                </div>
                            ) : (
                                // Solo mostrar botón de reservar si la cancha está disponible
                                !cancha.en_mantenimiento && (
                                    <Link 
                                        to={`/reservar/${cancha.id_cancha}`}
                                        className="bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-center shadow-md hover:shadow-lg"
                                    >
                                        Reservar Ahora
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full">
                        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                            <div className="max-w-md mx-auto">
                            <div className="text-5xl sm:text-7xl mb-6">🏟️</div>
                            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent mb-3">
                                No hay canchas disponibles
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-6">
                                Parece que aún no se han creado canchas en el sistema
                            </p>
                            {isAdmin() && (
                                <Link 
                                    to="/canchas/crear" 
                                    className="inline-block bg-gradient-to-r from-[#588157] to-[#3A5A40] hover:from-[#3A5A40] hover:to-[#344E41] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    + Crear la primera cancha
                                </Link>
                            )}
                        </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Confirmación para Eliminar Cancha */}
            {showConfirmDelete && canchaAEliminar && (
                <ConfirmDialog 
                    isOpen={showConfirmDelete}
                    onConfirm={confirmarEliminacion}
                    onCancel={cancelarEliminacion}
                    title="⚠️ Confirmar Eliminación"
                    message={
                        <div className="space-y-4">
                            <div className="border-l-4 border-red-500 pl-4">
                                <h4 className="font-semibold text-red-800">
                                    ¿Estás seguro de eliminar la Cancha {canchaAEliminar.numero}?
                                </h4>
                                <div className="mt-3 space-y-2 text-sm text-gray-700">
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <p className="font-medium text-red-800 mb-2">⚠️ Esta acción es irreversible</p>
                                        <ul className="space-y-1 text-red-700">
                                            <li>• Se eliminará permanentemente la cancha</li>
                                            <li>• Se cancelarán todas las reservas futuras</li>
                                            <li>• Se perderá el historial de reservas</li>
                                            <li>• Los usuarios serán notificados automáticamente</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center pt-2">
                                <p className="text-sm font-medium text-gray-800">
                                    Selecciona "ELIMINAR" y confirma para proceder
                                </p>
                            </div>
                        </div>
                    }
                    confirmText="Sí, eliminar Cancha"
                    cancelText="Cancelar"
                    type="danger"
                />
            )}
            </div>
        </div>
    );
}