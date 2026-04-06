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
        return <div className="text-center py-4">Cargando detalles...</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center py-4">{error}</div>;
    }

    if (!cancha) {
        return <div className="text-center py-4">No se encontró la cancha</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Cancha {cancha.id_cancha}</h1>
                    <Link 
                        to="/canchas"
                        className="text-blue-500 hover:text-blue-700"
                    >
                        Volver a la lista
                    </Link>
                </div>

                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Información General</h2>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600">ID</p>
                                <p className="font-medium">{cancha.id_cancha}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Estado</p>
                                <p className={`font-medium ${
                                    !cancha.en_mantenimiento ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {!cancha.en_mantenimiento ? 'Disponible' : 'En Mantenimiento'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">Precio</h2>
                        <div className="mt-2">
                            <p className="text-2xl font-bold text-green-600">
                                ${cancha.precio?.toLocaleString()}
                            </p>
                            <p className="text-gray-600 text-sm">por turno</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">Horarios Disponibles</h2>
                        <div className="mt-2">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {(Array.isArray(cancha.horarios_disponibles) ? cancha.horarios_disponibles : parseHorarios(cancha.horarios_disponibles)).map((horario, index) => (
                                    <div key={index} className="bg-gray-100 px-3 py-2 rounded text-center">
                                        {horario}
                                    </div>
                                ))}
                            </div>
                            {(Array.isArray(cancha.horarios_disponibles) ? cancha.horarios_disponibles : parseHorarios(cancha.horarios_disponibles)).length === 0 && (
                                <p className="text-gray-500 italic">No hay horarios disponibles</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">Fechas de Registro</h2>
                        <div className="mt-2 space-y-2">
                            <div>
                                <p className="text-gray-600">Creada el:</p>
                                <p className="font-medium">{new Date(cancha.fecha_creacion).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Última actualización:</p>
                                <p className="font-medium">{new Date(cancha.fecha_actualizacion).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

            
            </div>
        </div>
    );
}