import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerCanchas, obtenerCanchaPorId } from '../../api/canchas';
import { crearReserva, obtenerHorariosDisponibles } from '../../api/reservas';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/accionesCriticas/ConfirmDialog';

/**
 * Componente reutilizable para crear reservas
 * @param {Object} props
 * @param {boolean} props.isAdmin - Si true, muestra opciones de administrador
 * @param {string} props.canchaId - ID de cancha preseleccionada (para modo usuario)
 * @param {string} props.redirectPath - Ruta de redirección después de crear
 */
const NuevaReserva = ({ 
    isAdmin = false,
    canchaId = null,
    redirectPath = null
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [canchas, setCanchas] = useState([]);
    const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [horariosOcupados, setHorariosOcupados] = useState([]);
    const [todasLasReservas, setTodasLasReservas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCanchas, setLoadingCanchas] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmData, setConfirmData] = useState(null);
    
    const [formData, setFormData] = useState({
        id_cancha: canchaId || '',
        email_usuario: isAdmin ? '' : (user?.email || ''),
        nombre_usuario: isAdmin ? '' : (user?.nombre || ''),
        fecha: '',
        hora: '',
        duracion: 60,
        precio: '',
        estado: 'reservado'
    });

    useEffect(() => {
        if (canchaId) {
            cargarCanchaEspecifica();
        } else {
            cargarCanchas();
        }
    }, [canchaId]);

    useEffect(() => {
        if (formData.fecha && formData.id_cancha) {
            cargarHorariosDisponibles();
        }
    }, [formData.fecha, formData.duracion, formData.id_cancha]);

    const cargarCanchaEspecifica = async () => {
        try {
            setLoadingCanchas(true);
            const data = await obtenerCanchaPorId(canchaId);
            
            if (data.en_mantenimiento) {
                setError('Esta cancha no está disponible actualmente');
                setLoadingCanchas(false);
                return;
            }
            
            setCanchaSeleccionada(data);
            setFormData(prev => ({
                ...prev,
                id_cancha: canchaId,
                precio: data.precio || ''
            }));
        } catch (err) {
            console.error('Error cargando cancha:', err);
            setError('Error al cargar los datos de la cancha');
        } finally {
            setLoadingCanchas(false);
        }
    };

    const cargarCanchas = async () => {
        try {
            setLoadingCanchas(true);
            const canchasData = await obtenerCanchas();
            setCanchas(Array.isArray(canchasData) ? canchasData : []);
            
            if (formData.id_cancha && formData.fecha) {
                cargarHorariosDisponibles();
            }
        } catch (err) {
            console.error('Error cargando canchas:', err);
            setError('Error al cargar las canchas: ' + err.message);
            setCanchas([]);
        } finally {
            setLoadingCanchas(false);
        }
    };

    const verificarSuperposicion = (horaInicio, duracionMin, reservasExistentes) => {
        if (!horaInicio || !duracionMin || !reservasExistentes.length) return false;
        
        const [horasInicio, minutosInicio] = horaInicio.split(':').map(Number);
        const inicioEnMinutos = horasInicio * 60 + minutosInicio;
        const finEnMinutos = inicioEnMinutos + parseInt(duracionMin);
        
        for (const reserva of reservasExistentes) {
            const [horasReserva, minutosReserva] = reserva.hora.split(':').map(Number);
            const inicioReservaMinutos = horasReserva * 60 + minutosReserva;
            const duracionReserva = reserva.duracion || 60;
            const finReservaMinutos = inicioReservaMinutos + duracionReserva;
            
            const haySuperposicion = inicioEnMinutos < finReservaMinutos && finEnMinutos > inicioReservaMinutos;
            
            if (haySuperposicion) {
                return true;
            }
        }
        
        return false;
    };

    const filtrarHorariosSinSuperposicion = (horariosDisponibles, duracion, reservasExistentes) => {
        if (!horariosDisponibles.length || !reservasExistentes.length) return horariosDisponibles;
        
        return horariosDisponibles.filter(horario => {
            return !verificarSuperposicion(horario.hora, duracion, reservasExistentes);
        });
    };

    const cargarHorariosDisponibles = async () => {
        try {
            const responseReservas = await obtenerHorariosDisponibles(
                formData.id_cancha, 
                formData.fecha, 
                60
            );
            
            if (responseReservas.success) {
                setTodasLasReservas(responseReservas.data.horarios_ocupados || []);
            }
            
            const response = await obtenerHorariosDisponibles(
                formData.id_cancha, 
                formData.fecha, 
                formData.duracion
            );
            
            if (response.success) {
                const horariosOriginales = response.data.horarios_disponibles || [];
                const reservasExistentes = responseReservas.data.horarios_ocupados || [];
                
                const horariosFiltrados = filtrarHorariosSinSuperposicion(
                    horariosOriginales, 
                    formData.duracion, 
                    reservasExistentes
                );
                
                setHorariosDisponibles(horariosFiltrados);
                setHorariosOcupados(response.data.horarios_ocupados || []);
            }
        } catch (err) {
            console.error('Error al cargar horarios:', err);
            setHorariosDisponibles([]);
            setHorariosOcupados([]);
            setTodasLasReservas([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (error) setError('');
        if (success) setSuccess('');

        if (name === 'id_cancha' && !canchaId) {
            const canchaSelecionada = canchas.find(c => c.id_cancha === parseInt(value));
            if (canchaSelecionada) {
                setFormData(prev => ({
                    ...prev,
                    precio: canchaSelecionada.precio || ''
                }));
            }
        }
    };

    const validarFormulario = () => {
        if (!formData.id_cancha) {
            setError('Debes seleccionar una cancha');
            return false;
        }
        
        if (!formData.nombre_usuario.trim()) {
            setError('El nombre del usuario es obligatorio');
            return false;
        }

        if (!formData.email_usuario.trim()) {
            setError('El email del usuario es obligatorio');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email_usuario)) {
            setError('El email no tiene un formato válido');
            return false;
        }

        if (!formData.fecha) {
            setError('Debes seleccionar una fecha');
            return false;
        }

        if (!formData.hora) {
            setError('Debes seleccionar una hora');
            return false;
        }

        if (!formData.duracion || formData.duracion < 30) {
            setError('La duración mínima es de 30 minutos');
            return false;
        }

        if (!formData.precio || parseFloat(formData.precio) <= 0) {
            setError('Debes especificar un precio válido');
            return false;
        }

        // Verificar disponibilidad
        const horaOcupada = todasLasReservas.find(h => h.hora === formData.hora);
        if (horaOcupada && isAdmin) {
            return { valid: true, warning: `⚠️ Advertencia: Esta hora ya tiene una reserva existente (${horaOcupada.horario})` };
        } else if (horaOcupada && !isAdmin) {
            setError('La hora seleccionada ya no está disponible');
            return { valid: false };
        }

        return { valid: true };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validacion = validarFormulario();
        if (!validacion || !validacion.valid) {
            return;
        }

        const canchaInfo = canchaId ? canchaSeleccionada : canchas.find(c => c.id_cancha === parseInt(formData.id_cancha));
        const fechaFormateada = new Date(formData.fecha).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        setConfirmData({
            cancha: formData.id_cancha,
            fecha: fechaFormateada,
            hora: formData.hora,
            duracion: formData.duracion,
            precio: parseFloat(formData.precio),
            nombre: formData.nombre_usuario,
            email: formData.email_usuario,
            estado: formData.estado,
            nombreCancha: `Cancha ${canchaInfo?.id_cancha}`,
            warning: validacion.warning || null
        });

        setShowConfirm(true);
    };

    const confirmarReserva = async () => {
        setShowConfirm(false);
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const fechaHora = `${formData.fecha} ${formData.hora}:00`;
            
            const reservaData = {
                id_usuario: isAdmin ? null : (user?.userId || null),
                id_cancha: parseInt(formData.id_cancha),
                fecha_turno: fechaHora,
                duracion: parseInt(formData.duracion),
                precio: parseFloat(formData.precio),
                estado: formData.estado,
                email: formData.email_usuario,
                nombre: formData.nombre_usuario
            };

            const response = await crearReserva(reservaData);
            
            if (response.success) {
                setSuccess('¡Reserva creada exitosamente!');
                setTimeout(() => {
                    if (redirectPath) {
                        navigate(redirectPath);
                    } else if (isAdmin) {
                        navigate('/admin');
                    } else {
                        navigate('/reservas/historial');
                    }
                }, 2000);
            } else {
                setError(response.message || 'Error al crear la reserva');
            }

        } catch (err) {
            console.error('Error creando reserva:', err);
            setError(err.message || 'Error al crear la reserva');
        } finally {
            setLoading(false);
        }
    };

    const cancelarConfirmacion = () => {
        setShowConfirm(false);
        setConfirmData(null);
    };

    const obtenerFechaMinima = () => {
        const hoy = new Date();
        return hoy.toISOString().split('T')[0];
    };

    const obtenerFechaMaxima = () => {
        const hoy = new Date();
        const treintaDias = new Date(hoy.getTime() + (30 * 24 * 60 * 60 * 1000));
        return treintaDias.toISOString().split('T')[0];
    };

    if (loadingCanchas) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información...</p>
                </div>
            </div>
        );
    }

    if (error && !canchas.length && !canchaSeleccionada) {
        return (
            <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button 
                        onClick={() => navigate(isAdmin ? '/admin' : '/canchas')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Nueva Reserva</h2>
                        <p className="mt-2 text-sm sm:text-base text-gray-600">
                            {isAdmin ? 'Crea una nueva reserva como administrador' : `Reserva la Cancha ${canchaSeleccionada?.id_cancha || ''}`}
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={() => navigate(isAdmin ? '/admin' : '/canchas')}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition duration-200"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {isAdmin ? 'Volver al Dashboard' : 'Volver a Canchas'}
                            </button>
                        </div>
                    </div>

                    {/* Información de cancha (solo modo usuario) */}
                    {canchaId && canchaSeleccionada && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                            <h3 className="font-semibold mb-2">Información de la Cancha</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <p><span className="font-medium">Precio:</span> ${canchaSeleccionada.precio?.toLocaleString()}</p>
                                <p><span className="font-medium">Estado:</span> <span className="text-green-600">Disponible</span></p>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">{success}</span>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Información del Usuario */}
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Información del Usuario</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Nombre Completo *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre_usuario"
                                        value={formData.nombre_usuario}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                                        placeholder="Ej: Juan Pérez"
                                        required
                                        readOnly={!isAdmin}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email_usuario"
                                        value={formData.email_usuario}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                                        placeholder="ejemplo@correo.com"
                                        required
                                        readOnly={!isAdmin}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Información de la Reserva */}
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Detalles de la Reserva</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {!canchaId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cancha *
                                        </label>
                                        <select
                                            name="id_cancha"
                                            value={formData.id_cancha}
                                            onChange={handleChange}
                                            className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                            required
                                        >
                                            <option value="">Seleccionar cancha</option>
                                            {canchas.filter(cancha => !cancha.en_mantenimiento).map(cancha => (
                                                <option key={cancha.id_cancha} value={cancha.id_cancha}>
                                                    Cancha {cancha.id_cancha} - ${cancha.precio?.toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {isAdmin && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Estado
                                        </label>
                                        <select
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleChange}
                                            className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        >
                                            <option value="reservado">Reservado</option>
                                            <option value="completado">Completado</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            
                            {/* Información adicional para el admin */}
                            {isAdmin && formData.fecha && formData.id_cancha && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm font-medium text-blue-800">Información de Disponibilidad</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                cargarHorariosDisponibles();
                                                if (!canchaId) cargarCanchas();
                                            }}
                                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                                            title="Recargar horarios actualizados"
                                        >
                                            🔄 Actualizar
                                        </button>
                                    </div>
                                    <div className="text-xs text-blue-700 space-y-1">
                                        <p>• Horarios disponibles sin conflictos: {horariosDisponibles.length}</p>
                                        <p>• Reservas existentes: {todasLasReservas.length}</p>
                                        <p>• Duración seleccionada: {formData.duracion} minutos</p>
                                        <p>• Como administrador, puedes crear reservas incluso en horarios ocupados</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fecha y Hora */}
                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Fecha y Horario</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleChange}
                                        min={obtenerFechaMinima()}
                                        max={obtenerFechaMaxima()}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hora *
                                    </label>
                                    {formData.fecha && formData.id_cancha ? (
                                        <div className="space-y-4">
                                            {horariosDisponibles.length > 0 || todasLasReservas.length > 0 ? (
                                                <div className="space-y-4">
                                                    {/* Horarios disponibles */}
                                                    {horariosDisponibles.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-medium text-green-700 mb-2">
                                                                ✅ Horarios Disponibles ({horariosDisponibles.length})
                                                            </p>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                {horariosDisponibles.map((horario, index) => (
                                                                    <label key={`disponible-${index}`} className="flex items-center cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name="hora"
                                                                            value={horario.hora}
                                                                            checked={formData.hora === horario.hora}
                                                                            onChange={handleChange}
                                                                            className="sr-only"
                                                                        />
                                                                        <span className={`text-sm px-2 py-2 rounded flex-1 text-center transition-all duration-200 ${
                                                                            formData.hora === horario.hora 
                                                                                ? 'bg-green-500 text-white ring-2 ring-green-400' 
                                                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                        }`}>
                                                                            {horario.horario}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Horarios ocupados (solo admin) */}
                                                    {isAdmin && todasLasReservas.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-medium text-red-700 mb-2">
                                                                ⚠️ Horarios Ocupados ({todasLasReservas.length}) - Solo Admin
                                                            </p>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                {todasLasReservas.map((horario, index) => (
                                                                    <label key={`ocupado-${index}`} className="flex items-center cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name="hora"
                                                                            value={horario.hora}
                                                                            checked={formData.hora === horario.hora}
                                                                            onChange={handleChange}
                                                                            className="sr-only"
                                                                        />
                                                                        <span className={`text-sm px-2 py-2 rounded flex-1 text-center transition-all duration-200 border-2 ${
                                                                            formData.hora === horario.hora 
                                                                                ? 'bg-red-500 text-white ring-2 ring-red-400 border-red-600' 
                                                                                : 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
                                                                        }`}>
                                                                            {horario.horario}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
                                                                <span className="font-medium">⚠️ Advertencia:</span> Estos horarios ya tienen reservas.
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {formData.hora && (
                                                        <div className="text-sm p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                            <span className="font-medium text-blue-800">Hora seleccionada:</span> 
                                                            <span className="ml-2 text-blue-700">{formData.hora}</span>
                                                            {todasLasReservas.find(h => h.hora === formData.hora) && isAdmin && (
                                                                <span className="ml-2 text-red-700 font-medium">(⚠️ Superpuesta)</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                                    <p>No hay horarios disponibles para la fecha seleccionada</p>
                                                    <p className="text-sm mt-2">Intenta con otra fecha</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <select
                                            name="hora"
                                            value={formData.hora}
                                            onChange={handleChange}
                                            className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                            disabled
                                            required
                                        >
                                            <option value="">Primero selecciona fecha {!canchaId && 'y cancha'}</option>
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duración (min) *
                                    </label>
                                    <select
                                        name="duracion"
                                        value={formData.duracion}
                                        onChange={handleChange}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        required
                                    >
                                        <option value={60}>60 minutos</option>
                                        <option value={90}>90 minutos</option>
                                        <option value={120}>120 minutos</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Precio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500">$</span>
                                <input
                                    type="number"
                                    name="precio"
                                    value={formData.precio}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    placeholder="0.00"
                                    required
                                    readOnly={!isAdmin}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {isAdmin ? 'El precio se actualiza automáticamente al seleccionar una cancha' : 'Precio final de la reserva'}
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
                            <button
                                type="button"
                                onClick={() => navigate(isAdmin ? '/admin' : '/canchas')}
                                className="w-full sm:flex-1 py-2 sm:py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:flex-1 flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition duration-200 ${
                                    loading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creando Reserva...
                                    </div>
                                ) : (
                                    'Crear Reserva'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Modal de Confirmación */}
                    {showConfirm && confirmData && (
                        <ConfirmDialog 
                            isOpen={showConfirm}
                            onConfirm={confirmarReserva}
                            onCancel={cancelarConfirmacion}
                            title={`Confirmar Nueva Reserva${isAdmin ? ' (Admin)' : ''}`}
                            type="warning"
                            message={
                                <div className="space-y-4">
                                    {confirmData.warning && isAdmin && (
                                        <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-3 rounded">
                                            <h4 className="font-semibold text-red-800">🚨 Advertencia de Conflicto</h4>
                                            <p className="text-sm text-red-700 mt-1">{confirmData.warning}</p>
                                        </div>
                                    )}
                                    
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <h4 className="font-semibold text-gray-800">📋 Detalles de la Reserva</h4>
                                        <div className="mt-2 space-y-1 text-sm">
                                            <p><span className="font-medium">Cliente:</span> {confirmData.nombre}</p>
                                            <p><span className="font-medium">Email:</span> {confirmData.email}</p>
                                            <p><span className="font-medium">Cancha:</span> {confirmData.nombreCancha}</p>
                                            <p><span className="font-medium">Fecha:</span> {confirmData.fecha}</p>
                                            <p><span className="font-medium">Hora:</span> {confirmData.hora}</p>
                                            <p><span className="font-medium">Duración:</span> {confirmData.duracion} minutos</p>
                                            <p><span className="font-medium">Precio:</span> ${confirmData.precio?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-center pt-2">
                                        <p className="text-sm text-gray-600">
                                            ¿Confirmas que deseas crear esta reserva?
                                        </p>
                                    </div>
                                </div>
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default NuevaReserva;
