import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerCanchas, obtenerCanchaPorId } from '../../api/canchas';
import { crearReserva, obtenerHorariosDisponibles } from '../../api/reservas';
import { obtenerPerfilUsuario } from '../../api/usuarios';
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
        tipo_cancha: '',
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

    useEffect(() => {
        if (!isAdmin) {
            setFormData(prev => ({
                ...prev,
                email_usuario: user?.email || user?.user?.email || prev.email_usuario,
                nombre_usuario: user?.nombre || user?.user?.nombre || prev.nombre_usuario,
            }));

            // Si no tenemos el nombre o email en el contexto, lo buscamos en el backend
            if (user?.userId && (!user.nombre || !user.email) && !user?.user) {
                obtenerPerfilUsuario(user.userId)
                    .then(perfil => {
                        if (perfil) {
                            setFormData(prev => ({
                                ...prev,
                                email_usuario: perfil.email || prev.email_usuario,
                                nombre_usuario: perfil.nombre || prev.nombre_usuario,
                            }));
                        }
                    })
                    .catch(err => console.error('Error al obtener perfil del usuario:', err));
            }
        }
    }, [isAdmin, user]);

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
                precio: data.precio || '',
                tipo_cancha: data.tipo_cancha || 'Padel'
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
            setError('');
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
                const reservasExistentes = responseReservas?.data?.horarios_ocupados || [];

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

            const status = err?.status;
            const message = err?.message;
            if (status === 404) {
                setError(message || 'No se encontraron horarios para la cancha seleccionada');
            } else if (status === 400) {
                setError(message || 'Parámetros inválidos para obtener horarios');
            } else {
                setError(message || 'Error al cargar horarios disponibles');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Si se cambia la cancha, actualizar también el precio y tipo_cancha
        if (name === 'id_cancha' && !canchaId) {
            const canchaSelecionada = canchas.find(c => c.id_cancha === parseInt(value));
            setFormData(prev => ({
                ...prev,
                [name]: value,
                precio: canchaSelecionada?.precio || '',
                tipo_cancha: canchaSelecionada?.tipo_cancha || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        if (error) setError('');
        if (success) setSuccess('');
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
            tipo_cancha: formData.tipo_cancha,
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
                id_usuario: isAdmin ? null : (user?.userId || user?.id || null),
                id_cancha: parseInt(formData.id_cancha),
                tipo_cancha: formData.tipo_cancha || canchaSeleccionada?.tipo_cancha || 'Padel',
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
            <div className="min-h-screen bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#588157] mx-auto mb-4"></div>
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
                        className="bg-gradient-to-r from-[#A3B18A] to-[#588157] hover:from-[#588157] hover:to-[#3A5A40] text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#DAD7CD] to-[#A3B18A] py-4 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-[#588157] to-[#3A5A40] rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#588157] to-[#3A5A40] bg-clip-text text-transparent">Nueva Reserva</h2>
                        <p className="mt-2 text-sm sm:text-base text-gray-600">
                            {isAdmin ? 'Crea una nueva reserva como administrador' : `Reserva la Cancha ${canchaSeleccionada?.id_cancha || ''}`}
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={() => navigate(isAdmin ? '/admin' : '/canchas')}
                                className="inline-flex items-center text-sm text-[#588157] hover:text-[#3A5A40] font-semibold transition duration-200"
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
                        <div className="bg-gradient-to-r from-[#DAD7CD]/30 to-[#A3B18A]/30 p-4 rounded-lg mb-6 border border-[#A3B18A]/30">
                            <h3 className="font-semibold mb-2 text-[#3A5A40]">Información de la Cancha</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                <p><span className="font-medium">Tipo:</span> <span className="capitalize">{canchaSeleccionada.tipo_cancha || 'No especificado'}</span></p>
                                <p><span className="font-medium">Precio:</span> ${canchaSeleccionada.precio?.toLocaleString()}</p>
                                <p><span className="font-medium">Estado:</span> <span className="text-[#588157] font-semibold">Disponible</span></p>
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
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Título de sección */}
                        <div className="border-b border-gray-200 pb-3">
                            <h3 className="text-lg font-semibold text-[#3A5A40] flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Información del Usuario
                            </h3>
                        </div>

                        {/* Campo Nombre */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-1">
                                    Nombre Completo
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <input
                                type="text"
                                name="nombre_usuario"
                                value={formData.nombre_usuario}
                                readOnly={!isAdmin}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200 ${
                                    !isAdmin ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                                placeholder={isAdmin ? "Ej: Juan Pérez" : (user?.nombre || user?.user?.nombre || "Cargando...")}
                                required
                            />
                            {!isAdmin && formData.nombre_usuario && (
                                <p className="mt-1 text-xs text-[#588157] font-medium">
                                    ✓ {formData.nombre_usuario}
                                </p>
                            )}
                        </div>

                        {/* Campo Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-1">
                                    Correo Electrónico
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <input
                                type="email"
                                name="email_usuario"
                                value={formData.email_usuario}
                                readOnly={!isAdmin}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200 ${
                                    !isAdmin ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                                placeholder={isAdmin ? "ejemplo@correo.com" : (user?.email || user?.user?.email || "Cargando...")}
                                required
                            />
                            {!isAdmin && formData.email_usuario && (
                                <p className="mt-1 text-xs text-[#588157] font-medium">
                                    ✓ {formData.email_usuario}
                                </p>
                            )}
                        </div>

                        {/* Título de sección - Detalles de Reserva */}
                        <div className="border-b border-gray-200 pb-3 pt-3">
                            <h3 className="text-lg font-semibold text-[#3A5A40] flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Detalles de la Reserva
                            </h3>
                        </div>

                        {/* Campo Cancha (solo si no viene preseleccionada) */}
                        {!canchaId && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <span className="flex items-center gap-1">
                                        Cancha
                                        <span className="text-red-500">*</span>
                                    </span>
                                </label>
                                <select
                                    name="id_cancha"
                                    value={formData.id_cancha}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                    required
                                >
                                    <option value="">Seleccionar cancha</option>
                                    {canchas.filter(cancha => !cancha.en_mantenimiento).map(cancha => (
                                        <option key={cancha.id_cancha} value={cancha.id_cancha}>
                                            Cancha {cancha.id_cancha} - {cancha.tipo_cancha || 'Sin tipo'} - ${cancha.precio?.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Campo Fecha */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-1">
                                    Fecha
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <input
                                type="date"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleChange}
                                min={obtenerFechaMinima()}
                                max={obtenerFechaMaxima()}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Puedes reservar hasta 30 días por adelantado
                            </p>
                        </div>

                        {/* Campo Duración */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-1">
                                    Duración
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <select
                                name="duracion"
                                value={formData.duracion}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                required
                            >
                                <option value={60}>60 minutos (1 hora)</option>
                                <option value={90}>90 minutos (1.5 horas)</option>
                                <option value={120}>120 minutos (2 horas)</option>
                            </select>
                        </div>

                        {/* Información adicional para el admin */}
                        {isAdmin && formData.fecha && formData.id_cancha && (
                            <div className="p-3 bg-gradient-to-r from-[#DAD7CD]/40 to-[#A3B18A]/40 rounded-lg border border-[#588157]/30">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 text-[#588157] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm font-medium text-[#3A5A40]">Información de Disponibilidad</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            cargarHorariosDisponibles();
                                            if (!canchaId) cargarCanchas();
                                        }}
                                        className="text-xs bg-[#A3B18A] hover:bg-[#588157] text-white px-2 py-1 rounded transition-colors font-semibold"
                                        title="Recargar horarios actualizados"
                                    >
                                        🔄 Actualizar
                                    </button>
                                </div>
                                <div className="text-xs text-[#3A5A40] space-y-1">
                                    <p>• Horarios disponibles sin conflictos: {horariosDisponibles.length}</p>
                                    <p>• Reservas existentes: {todasLasReservas.length}</p>
                                    <p>• Duración seleccionada: {formData.duracion} minutos</p>
                                    <p>• Como administrador, puedes crear reservas incluso en horarios ocupados</p>
                                </div>
                            </div>
                        )}

                        {/* Campo Hora */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-1">
                                    Horario
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            {formData.fecha && formData.id_cancha ? (
                                <div className="space-y-4">
                                    {horariosDisponibles.length > 0 || todasLasReservas.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* Horarios disponibles */}
                                            {horariosDisponibles.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-[#588157] mb-3 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Horarios Disponibles ({horariosDisponibles.length})
                                                    </p>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
                                                                <span className={`text-sm px-3 py-2.5 rounded-lg flex-1 text-center transition-all duration-200 font-medium ${formData.hora === horario.hora
                                                                    ? 'bg-[#588157] text-white ring-2 ring-[#588157] shadow-md'
                                                                    : 'bg-[#DAD7CD] text-[#3A5A40] hover:bg-[#A3B18A] hover:text-white'
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
                                                    <p className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        Horarios Ocupados ({todasLasReservas.length}) - Solo Admin
                                                    </p>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
                                                                <span className={`text-sm px-3 py-2.5 rounded-lg flex-1 text-center transition-all duration-200 border-2 font-medium ${formData.hora === horario.hora
                                                                    ? 'bg-red-500 text-white ring-2 ring-red-400 border-red-600 shadow-md'
                                                                    : 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
                                                                    }`}>
                                                                    {horario.horario}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="text-xs text-red-600 mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                                        <span className="font-semibold">⚠️ Advertencia:</span> Estos horarios ya tienen reservas existentes.
                                                    </div>
                                                </div>
                                            )}

                                            {formData.hora && (
                                                <div className="text-sm p-3 bg-gradient-to-r from-[#DAD7CD]/40 to-[#A3B18A]/40 rounded-lg border border-[#588157]/30">
                                                    <span className="font-semibold text-[#3A5A40]">Hora seleccionada:</span>
                                                    <span className="ml-2 text-[#588157] font-bold">{formData.hora}</span>
                                                    {todasLasReservas.find(h => h.hora === formData.hora) && isAdmin && (
                                                        <span className="ml-2 text-red-700 font-semibold">(⚠️ Superpuesta)</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="font-medium">No hay horarios disponibles</p>
                                            <p className="text-sm mt-1">Intenta con otra fecha o duración</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-medium">Primero selecciona fecha {!canchaId && 'y cancha'}</p>
                                </div>
                            )}
                        </div>

                        {/* Precio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="flex items-center gap-1">
                                    Precio
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-500 font-semibold">$</span>
                                <input
                                    type="number"
                                    name="precio"
                                    value={formData.precio}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                    placeholder="0.00"
                                    required
                                    readOnly={true}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {isAdmin
                                    ? 'El precio se toma de la cancha seleccionada. Para modificarlo, edita la cancha.'
                                    : 'Precio final de la reserva'}
                            </p>
                        </div>

                        {/* Campo Estado (solo admin) */}
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estado de la Reserva
                                </label>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition duration-200"
                                >
                                    <option value="reservado">Reservado</option>
                                    <option value="completado">Completado</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Define el estado inicial de la reserva
                                </p>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate(isAdmin ? '/admin' : '/canchas')}
                                className="w-full sm:flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#588157] transition-all duration-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all duration-200 ${loading
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
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Crear Reserva
                                    </>
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
                                <div className="space-y-3">
                                    {confirmData.warning && isAdmin && (
                                        <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-3 rounded">
                                            <h4 className="font-semibold text-red-800">🚨 Advertencia de Conflicto</h4>
                                            <p className="text-sm text-red-700 mt-1">{confirmData.warning}</p>
                                        </div>
                                    )}

                                    {/* Layout de 2 columnas en pantallas grandes */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Columna 1: Detalles de la Reserva */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                                                </svg>
                                                Detalles de la Reserva
                                            </h4>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Cliente</span>
                                                    <p className="font-semibold text-gray-800">{confirmData.nombre}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Cancha</span>
                                                    <p className="font-semibold text-gray-800">{confirmData.nombreCancha}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Tipo</span>
                                                    <p className="font-semibold text-gray-800 capitalize">{confirmData.tipo_cancha || 'No especificado'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Fecha</span>
                                                    <p className="font-semibold text-gray-800">{confirmData.fecha}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Hora</span>
                                                    <p className="font-semibold text-gray-800">{confirmData.hora}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Duración</span>
                                                    <p className="font-semibold text-gray-800">{confirmData.duracion} min</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Precio Total</span>
                                                    <p className="font-semibold text-green-700 text-lg">${confirmData.precio?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-blue-200">
                                                <span className="text-xs text-gray-500">Email de contacto</span>
                                                <p className="font-medium text-gray-800 text-sm">{confirmData.email}</p>
                                            </div>
                                        </div>

                                        {/* Columna 2: Monto e Instrucciones */}
                                        <div className="space-y-3">
                                            {/* Monto a Pagar */}
                                            <div className="bg-gradient-to-br from-[#588157]/10 to-[#3A5A40]/10 border-2 border-[#588157] rounded-xl p-4 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg className="w-5 h-5 text-[#588157]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <h4 className="text-base font-bold text-[#3A5A40]">Pago de Seña (50%)</h4>
                                                </div>
                                                <div className="text-center py-2">
                                                    <p className="text-xs text-gray-600 mb-1">Monto a transferir</p>
                                                    <p className="text-3xl font-bold text-[#588157]">
                                                        ${(confirmData.precio * 0.5)?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Datos de Transferencia Compactos */}
                                            <div className="bg-white rounded-lg p-3 border border-[#A3B18A] shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">Alias</span>
                                                    <button 
                                                        onClick={() => navigator.clipboard.writeText('padel.club.admin')}
                                                        className="text-xs bg-[#588157] hover:bg-[#3A5A40] text-white px-2 py-1 rounded transition-colors font-medium"
                                                        type="button"
                                                    >
                                                        📋 Copiar
                                                    </button>
                                                </div>
                                                <code className="block text-center text-lg font-mono font-bold text-[#3A5A40] bg-[#DAD7CD]/50 px-3 py-2 rounded">
                                                    padel.club.admin
                                                </code>
                                                <p className="text-xs text-gray-500 text-center mt-1">Padel Club XYZ</p>
                                            </div>

                                            {/* WhatsApp */}
                                            <a 
                                                href="https://wa.me/+5493515606326" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-3 rounded-lg transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                </svg>
                                                Enviar Comprobante por WhatsApp
                                            </a>
                                        </div>
                                    </div>

                                    {/* Pasos a seguir - Ancho completo */}
                                    <div className="bg-gradient-to-r from-[#588157]/10 to-[#3A5A40]/10 rounded-lg p-4 border-l-4 border-[#588157]">
                                        <h5 className="text-sm font-bold text-[#3A5A40] mb-3 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                            </svg>
                                            Próximos Pasos
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="flex items-start gap-2">
                                                <span className="flex-shrink-0 w-6 h-6 bg-[#588157] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                                <span className="text-xs text-gray-700">Realiza la transferencia por el monto indicado</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="flex-shrink-0 w-6 h-6 bg-[#588157] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                                <span className="text-xs text-gray-700">Envía el comprobante por WhatsApp</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="flex-shrink-0 w-6 h-6 bg-[#588157] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                                <span className="text-xs text-gray-700">Recibirás la confirmación en tu email</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confirmación final */}
                                    <div className="text-center pt-2 border-t border-gray-200">
                                        <p className="text-sm font-semibold text-gray-800 mb-1">
                                            ¿Confirmas que deseas crear esta reserva?
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Se enviará un email con los detalles a <span className="font-medium text-[#588157]">{confirmData.email}</span>
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
