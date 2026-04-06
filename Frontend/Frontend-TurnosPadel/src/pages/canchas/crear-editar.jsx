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
        horarios_disponibles: [
            "08:00-09:30", "09:30-11:00", "11:00-12:30", 
            "12:30-14:00", "14:00-15:30", "15:30-17:00", 
            "17:00-18:30", "18:30-20:00", "20:00-21:30", "21:30-23:00"
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
                await crearCancha(datosCancha);
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
        return <div className="text-center py-4">Cargando...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-6">
                    {id ? 'Editar Cancha' : 'Nueva Cancha'}
                </h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 mb-2">Precio por Turno</label>
                        <input
                            type="number"
                            name="precio"
                            value={cancha.precio}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            placeholder="Precio en pesos"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="en_mantenimiento"
                                checked={cancha.en_mantenimiento}
                                onChange={handleChange}
                            />
                            <span className="text-gray-700">En Mantenimiento</span>
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Si está marcado, la cancha no estará disponible para reservas
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Horarios Disponibles</h3>
                            <button
                                type="button"
                                onClick={agregarHorario}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                                + Agregar Horario
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {cancha.horarios_disponibles.map((horario, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={horario}
                                        onChange={(e) => handleHorarioChange(index, e.target.value)}
                                        className="flex-1 p-2 border rounded"
                                        placeholder="Ej: 08:00-09:30"
                                        pattern="[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}"
                                        title="Formato: HH:MM-HH:MM"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => eliminarHorario(index)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <p className="text-sm text-gray-500">
                            Formato requerido: HH:MM-HH:MM (ejemplo: 08:00-09:30)
                        </p>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/canchas')}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}