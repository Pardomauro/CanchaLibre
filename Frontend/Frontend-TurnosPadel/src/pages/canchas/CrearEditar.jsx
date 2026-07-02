import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { crearCancha, actualizarCancha, obtenerCanchaPorId } from '../../api/canchas';

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

export default function CrearEditarCancha() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cancha, setCancha] = useState({
        precio: '',
        en_mantenimiento: false,
        tipo_cancha: 'Padel',
        horarios_disponibles: [
            "08:00-09:00", "09:00-10:00", "10:00-11:00",
            "11:00-12:00", "12:00-13:00", "13:00-14:00",
            "14:00-15:00", "15:00-16:00", "16:00-17:00",
            "17:00-18:00", "18:00-19:00", "19:00-20:00",
            "20:00-21:00", "21:00-22:00"
        ]
    });
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (id) {
            cargarCancha();
        }
    }, [id]);

    const cargarCancha = async () => {
        try {
            setLoading(true);
            const data = await obtenerCanchaPorId(id);
            // Convertir horarios_disponibles de JSON string a array de forma segura
            const canchaData = {
                ...data,
                horarios_disponibles: Array.isArray(data.horarios_disponibles) ? data.horarios_disponibles : parseHorarios(data.horarios_disponibles)
            };
            setCancha(canchaData);
            setError(null);
        } catch (err) {
            setError('Error al cargar la cancha');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            console.log('📝 Enviando datos de cancha:', {
                id,
                cancha,
                operation: id ? 'update' : 'create'
            });

            // Validar datos antes de enviar
            if (!cancha.precio || cancha.precio <= 0) {
                throw new Error('El precio debe ser mayor a 0');
            }

            if (!cancha.tipo_cancha) {
                throw new Error('Debe seleccionar el tipo de cancha');
            }

            if (!cancha.horarios_disponibles || cancha.horarios_disponibles.length === 0) {
                throw new Error('Debe especificar al menos un horario disponible');
            }

            // Filtrar horarios vacíos
            const horariosLimpios = cancha.horarios_disponibles.filter(horario => horario.trim() !== '');
            if (horariosLimpios.length === 0) {
                throw new Error('Debe especificar al menos un horario válido');
            }

            const datosCancha = {
                precio: parseFloat(cancha.precio),
                en_mantenimiento: Boolean(cancha.en_mantenimiento), // Asegurar que sea boolean
                tipo_cancha: cancha.tipo_cancha,
                horarios_disponibles: horariosLimpios
            };

            console.log('📝 Datos finales a enviar:', {
                precio: { valor: datosCancha.precio, tipo: typeof datosCancha.precio },
                en_mantenimiento: { valor: datosCancha.en_mantenimiento, tipo: typeof datosCancha.en_mantenimiento },
                horarios_disponibles: { valor: datosCancha.horarios_disponibles, tipo: typeof datosCancha.horarios_disponibles, esArray: Array.isArray(datosCancha.horarios_disponibles) }
            });

            if (id) {
                const resultado = await actualizarCancha(id, datosCancha);
                if (resultado.success) {
                    // Mostrar mensaje de éxito específico
                    setSuccess(resultado.message || `Actualización de cancha ${id} realizada correctamente`);
                    // Redirigir después de 2 segundos para que el usuario vea el mensaje
                    setTimeout(() => {
                        navigate('/canchas');
                    }, 2000);
                    return; // No continuar con la navegación inmediata
                }
            } else {
                const resultado = await crearCancha(datosCancha);
                if (resultado.success) {
                    // Mostrar mensaje de éxito específico
                    setSuccess(resultado.message || 'Cancha creada correctamente');
                    // Redirigir después de 2 segundos para que el usuario vea el mensaje
                    setTimeout(() => {
                        navigate('/canchas');
                    }, 2000);
                    return; // No continuar con la navegación inmediata
                }
            }

            navigate('/canchas');
        } catch (err) {
            console.error('❌ Error al guardar cancha:', err);
            setError(err.message || 'Error al guardar la cancha');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setCancha(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleHorarioChange = (index, value) => {
        setCancha(prev => ({
            ...prev,
            horarios_disponibles: prev.horarios_disponibles.map((horario, i) => 
                i === index ? value : horario
            )
        }));
    };

    const agregarHorario = () => {
        setCancha(prev => ({
            ...prev,
            horarios_disponibles: [...prev.horarios_disponibles, ""]
        }));
    };

    const eliminarHorario = (index) => {
        setCancha(prev => ({
            ...prev,
            horarios_disponibles: prev.horarios_disponibles.filter((_, i) => i !== index)
        }));
    };

    if (loading && id) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-[#588157] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-[#3A5A40] font-semibold">Cargando cancha...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] p-4 rounded-xl shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {id ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                )}
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">
                                {id ? 'Editar Cancha' : 'Nueva Cancha'}
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">
                                {id ? 'Modifica los datos de la cancha existente' : 'Completa los datos para crear una nueva cancha'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mensajes de Error y Éxito */}
                {error && (
                    <div className="bg-white rounded-2xl shadow-xl p-5 mb-6 border-l-4 border-red-500">
                        <div className="flex items-start gap-3">
                            <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-white rounded-2xl shadow-xl p-5 mb-6 border-l-4 border-[#588157]">
                        <div className="flex items-start gap-3">
                            <div className="bg-[#A3B18A]/30 p-2 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-[#588157]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-[#3A5A40] mb-1">¡Éxito!</h3>
                                <p className="text-[#588157]">{success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Precio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Precio por Turno
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-500 font-semibold">$</span>
                                <input
                                    type="number"
                                    name="precio"
                                    value={cancha.precio}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Precio en pesos argentinos</p>
                        </div>

                        {/* Tipo de Cancha */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                    Tipo de Cancha
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <select
                                name="tipo_cancha"
                                value={cancha.tipo_cancha}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200 bg-white"
                                required
                            >
                                <option value="Padel">Padel</option>
                                <option value="Futbol">Fútbol</option>
                                <option value="Tenis">Tenis</option>
                                <option value="Otra">Otra</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Selecciona el tipo de deporte de la cancha</p>
                        </div>

                        {/* Estado de Mantenimiento */}
                        <div className="p-4 bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 rounded-lg border border-[#588157]/20">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="flex items-center h-6">
                                    <input
                                        type="checkbox"
                                        name="en_mantenimiento"
                                        checked={cancha.en_mantenimiento}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-[#588157] bg-gray-100 border-gray-300 rounded focus:ring-[#588157] focus:ring-2"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="font-semibold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Cancha en Mantenimiento
                                    </span>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Si está marcado, la cancha no estará disponible para nuevas reservas
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Horarios Disponibles */}
                        <div>
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-bold text-[#3A5A40]">Horarios Disponibles</h3>
                                    <span className="text-red-500 text-sm">*</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={agregarHorario}
                                    className="flex items-center gap-2 bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Agregar Horario
                                </button>
                            </div>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {cancha.horarios_disponibles.map((horario, index) => (
                                    <div key={index} className="flex gap-3 items-center group">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] rounded-lg flex items-center justify-center font-bold text-[#3A5A40] text-sm">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={horario}
                                            onChange={(e) => handleHorarioChange(index, e.target.value)}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                            placeholder="Ej: 08:00-09:30"
                                            pattern="[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}"
                                            title="Formato: HH:MM-HH:MM"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => eliminarHorario(index)}
                                            className="flex-shrink-0 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-110 group-hover:bg-red-600"
                                            title="Eliminar horario"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-gradient-to-r from-[#DAD7CD]/40 to-[#A3B18A]/40 rounded-lg border border-[#588157]/30">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-[#588157] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-[#3A5A40]">
                                        <p className="font-semibold mb-1">Formato requerido: HH:MM-HH:MM</p>
                                        <p className="text-xs">Ejemplos: 08:00-09:30, 14:00-15:30, 20:00-21:30</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate('/canchas')}
                                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#588157] transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all duration-200 ${
                                    loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#588157] transform hover:scale-[1.02]'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {id ? 'Actualizar Cancha' : 'Crear Cancha'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #A3B18A;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #588157;
                }
            `}</style>
        </div>
    );
}