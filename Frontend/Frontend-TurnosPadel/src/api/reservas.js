
// Peticiones http relacionadas con las reservas 
import { validarDatosReserva } from '../utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';


const normalizarToken = (token) => {
    if (!token) return null;
    let t = String(token).trim();
    if (!t || t === 'null' || t === 'undefined') return null;
    t = t.replace(/^Bearer\s+/i, '');
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        t = t.slice(1, -1);
    }
    return t || null;
};

const leerErrorRespuesta = async (response) => {
    const contentType = response.headers?.get?.('content-type') || '';
    try {
        if (contentType.includes('application/json')) return await response.json();
        const text = await response.text();
        const trimmed = (text || '').trim();
        if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
            return { message: 'Endpoint no encontrado (revisá backend/proxy)' };
        }
        return { message: trimmed };
    } catch {
        return {};
    }
};


// Helper para crear headers con Authorization si existe token
const getAuthHeaders = (tokenOverride) => {
    const token = normalizarToken(tokenOverride ?? localStorage.getItem('token'));
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// Función para obtener todas las reservas (solo administrador)
export const obtenerReservas = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener las reservas');
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener reserva por id (solo administrador)
export const obtenerReservaPorId = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener la reserva');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para crear una nueva reserva 
// Campos esperados en el objeto reserva:
// - id_usuario: ID del usuario que hace la reserva
// - id_cancha: ID de la cancha a reservar
// - fecha_turno: Fecha y hora en formato "YYYY-MM-DD HH:MM:SS"
// - duracion: Duración en minutos (ej: 60, 90, 120)
// - precio: Precio de la reserva
// - estado: Estado del turno ('reservado', 'cancelado', 'completado')
// - email: Email del usuario (para confirmación)
// - nombre: Nombre del usuario (para confirmación)
export const crearReserva = async (reserva) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reserva)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response completo:', errorData);
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);

            // Si hay errores de validación específicos, mostrarlos
            if (errorData.errors) {
                console.error('Errores de validación:', errorData.errors);
                throw new Error(`Errores de validación: ${errorData.errors.map(e => e.msg).join(', ')}`);
            }

            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para actualizar una reserva existente (solo administrador)
export const actualizarReserva = async (id, reserva) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(reserva)
        });

        if (!response.ok) {
            throw new Error('Error al actualizar la reserva');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para eliminar una reserva (solo administrador)
export const eliminarReserva = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la reserva');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para verificar disponibilidad de una cancha en fecha y hora específica
// Parámetros:
// - id_cancha: ID de la cancha
// - fecha: Fecha en formato "YYYY-MM-DD"
// - hora: Hora en formato "HH:MM"
export const verificarDisponibilidadCancha = async (id_cancha, fecha, hora) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/disponibilidad/${id_cancha}/${fecha}/${hora}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al verificar la disponibilidad');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener turnos por fecha específica
export const obtenerTurnosPorFecha = async (fecha) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/fecha/${fecha}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener los turnos por fecha');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener turnos disponibles (wrapper práctico)
// Si se pasa `fecha` filtra por fecha, si se pasa `id_cancha` filtra por cancha
export const obtenerTurnosDisponibles = async (fecha = '', id_cancha = '') => {
    try {
        let url = `${API_BASE_URL}/turnos`;
        const params = [];
        if (fecha) params.push(`fecha=${encodeURIComponent(fecha)}`);
        if (id_cancha) params.push(`id_cancha=${encodeURIComponent(id_cancha)}`);
        if (params.length) url += `?${params.join('&')}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener los turnos disponibles');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener todas las reservas con paginación
export const obtenerReservasPaginadas = async (pagina = 1, limite = 10) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos?pagina=${pagina}&limite=${limite}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener las reservas paginadas');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para actualizar parcialmente una reserva (permite actualizar solo algunos campos)
// Campos opcionales: id_usuario, id_cancha, fecha_turno, duracion, precio, estado
export const actualizarReservaParcial = async (id, camposActualizar) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(camposActualizar)
        });

        if (!response.ok) {
            throw new Error('Error al actualizar la reserva parcialmente');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Las funciones de validación están disponibles en ../utils
// Importar validarDatosReserva si necesitas validar datos antes de enviarlos

export const obtenerReservaUsuario = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/usuario/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener la reserva del usuario');
        }

        const data = await response.json();
        return data.data; // Devolver solo el array de turnos
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener horarios disponibles de una cancha en una fecha específica
export const obtenerHorariosDisponibles = async (id_cancha, fecha, duracion = 60) => {
    try {
        if (!id_cancha || !fecha) {
            const err = new Error('Faltan parámetros para obtener horarios');
            err.status = 400;
            throw err;
        }

        const url = `${API_BASE_URL}/turnos/horarios-disponibles/${encodeURIComponent(id_cancha)}/${encodeURIComponent(fecha)}/${encodeURIComponent(duracion)}`;
        const response = await fetch(url, {
            method: 'GET',
            // Este endpoint es público; evitamos headers innecesarios.
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const err = new Error(errorData?.message || 'Error al obtener los horarios disponibles');
            err.status = response.status;
            err.data = errorData;
            err.url = url;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener reservas por usuario (alias para obtenerReservaUsuario)
export const obtenerReservasPorUsuario = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/turnos/usuario/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al obtener las reservas del usuario');
        }

        const data = await response.json();
        return data.data || []; // Devolver solo el array de turnos
    } catch (error) {
        console.error(error);
        throw error;
    }
};

