import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerCanchaPorId } from '../../api/canchas';

// Función helper para parsear horarios de forma segura
const parseHorarios = (horarios) => {
    try {
        if (!horarios) return [];
        if (Array.isArray(horarios)) return horarios;
        if (typeof horarios === 'string') {
            const parsed = JSON.parse(horarios);
            return Array.isArray(parsed) ? parsed : [];
        }
        return [];
    } catch (error) {
        console.warn('Error parsing horarios:', error);
        return [];
    }
};

export default function DetalleCancha() {
    const { id } = useParams();
    const [cancha, setCancha] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDetalleCancha();
    }, [id]);

    const cargarDetalleCancha = async () => {
        try {
            const data = await obtenerCanchaPorId(id);
            setCancha(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar los detalles de la cancha');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-[#588157] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-[#3A5A40] font-semibold">Cargando detalles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-red-100 p-4 rounded-full">
                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Error</h3>
                    <p className="text-red-600 text-center mb-6">{error}</p>
                    <Link 
                        to="/canchas"
                        className="block w-full bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-3 px-4 rounded-lg transition-all duration-200 text-center font-semibold shadow-md hover:shadow-lg"
                    >
                        Volver a la lista
                    </Link>
                </div>
            </div>
        );
    }

    if (!cancha) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 mb-6 text-lg">No se encontró la cancha</p>
                    <Link 
                        to="/canchas"
                        className="inline-block bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-3 px-6 rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                        Volver a la lista
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-4 rounded-xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                    Cancha {cancha.id_cancha}
                                </h1>
                                <p className="text-gray-600 text-sm mt-1">Detalles de la cancha</p>
                            </div>
                        </div>
                        <Link 
                            to="/canchas"
                            className="flex items-center gap-2 bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white py-2.5 px-5 rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información General */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
                            <div className="bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] p-3 rounded-lg">
                                <svg className="w-6 h-6 text-[#3A5A40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-[#3A5A40]">Información General</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg">
                                <span className="text-gray-700 font-medium">ID de Cancha</span>
                                <span className="text-[#588157] font-bold text-lg">{cancha.id_cancha}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg">
                                <span className="text-gray-700 font-medium">Tipo de Cancha</span>
                                <span className="flex items-center gap-2 font-bold text-[#3A5A40] text-lg">
                                    <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                    {cancha.tipo_cancha || 'No especificado'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg">
                                <span className="text-gray-700 font-medium">Estado</span>
                                <span className={`flex items-center gap-2 font-semibold px-3 py-1 rounded-full text-sm ${
                                    !cancha.en_mantenimiento 
                                        ? 'bg-[#588157] text-white' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {!cancha.en_mantenimiento ? (
                                        <>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Disponible
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            En Mantenimiento
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Precio */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
                            <div className="bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] p-3 rounded-lg">
                                <svg className="w-6 h-6 text-[#3A5A40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-[#3A5A40]">Precio</h2>
                        </div>
                        <div className="flex items-center justify-center py-8 bg-gradient-to-br from-[#588157]/10 to-[#3A5A40]/10 rounded-xl">
                            <div className="text-center">
                                <p className="text-5xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent mb-2">
                                    ${cancha.precio?.toLocaleString()}
                                </p>
                                <p className="text-gray-600 font-medium">por turno</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Horarios Disponibles */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
                        <div className="bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] p-3 rounded-lg">
                            <svg className="w-6 h-6 text-[#3A5A40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-[#3A5A40]">Horarios Disponibles</h2>
                    </div>
                    <div>
                        {(Array.isArray(cancha.horarios_disponibles) ? cancha.horarios_disponibles : parseHorarios(cancha.horarios_disponibles)).length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {(Array.isArray(cancha.horarios_disponibles) ? cancha.horarios_disponibles : parseHorarios(cancha.horarios_disponibles)).map((horario, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] px-4 py-3 rounded-lg text-center font-semibold text-[#3A5A40] shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                    >
                                        {horario}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-500 italic font-medium">No hay horarios disponibles</p>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Fechas de Registro 
                <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
                        <div className="bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] p-3 rounded-lg">
                            <svg className="w-6 h-6 text-[#3A5A40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-[#3A5A40]">Registro y Actualizaciones</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg">
                            <p className="text-gray-600 text-sm font-medium mb-2">Fecha de Creación</p>
                            <p className="text-[#3A5A40] font-bold text-lg">
                                {new Date(cancha.fecha_creacion).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                {new Date(cancha.fecha_creacion).toLocaleTimeString('es-ES')}
                            </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg">
                            <p className="text-gray-600 text-sm font-medium mb-2">Última Actualización</p>
                            <p className="text-[#3A5A40] font-bold text-lg">
                                {new Date(cancha.fecha_actualizacion).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                {new Date(cancha.fecha_actualizacion).toLocaleTimeString('es-ES')}
                            </p>
                        </div>
                    </div>
                </div> */}



            </div>
        </div>
    );
}