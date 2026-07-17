// API para estadísticas del dashboard administrativo

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const normalizarToken = (rawToken) => {
    if (rawToken === null || typeof rawToken === 'undefined') return null;

    let token = String(rawToken).trim();
    if (!token) return null;

    // Valores comunes cuando se guardó mal en localStorage
    if (token === 'null' || token === 'undefined') return null;

    // Si lo guardaron con el prefijo incluido
    if (token.toLowerCase().startsWith('bearer ')) {
        token = token.slice('bearer '.length).trim();
    }

    // Si quedó con comillas (por ejemplo, JSON.stringify)
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1).trim();
    }

    return token || null;
};

// Helper para crear headers con Authorization si existe token
const getAuthHeaders = (tokenOverride) => {
    const token = normalizarToken(tokenOverride ?? localStorage.getItem('token'));
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const leerErrorRespuesta = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

// Función para obtener estadísticas generales
export const obtenerEstadisticas = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener las estadísticas';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        throw error;
    }
};

// Función para obtener estadísticas de canchas
export const obtenerEstadisticasCanchas = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas/canchas`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener estadísticas de canchas';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener estadísticas de canchas:', error);
        throw error;
    }
};

// Función para obtener estadísticas de reservas
export const obtenerEstadisticasReservas = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas/reservas`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener estadísticas de reservas';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener estadísticas de reservas:', error);
        throw error;
    }
};

// Función para obtener estadísticas de usuarios
export const obtenerEstadisticasUsuarios = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas/usuarios`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener estadísticas de usuarios';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener estadísticas de usuarios:', error);
        throw error;
    }
};

// Función para obtener ingresos del mes
export const obtenerIngresosMes = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas/ingresos`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener ingresos del mes';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener ingresos del mes:', error);
        throw error;
    }
};

// NUEVOS ENDPOINTS
export const obtenerTipoCanchas = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas/tipo-canchas`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener estadísticas de tipo de canchas';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener tipo de canchas:', error);
        throw error;
    }
};

export const obtenerTopUsuarios = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas/top-usuarios`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener top usuarios';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener top usuarios:', error);
        throw error;
    }
};

export const obtenerHorariosMasReservados = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas/horarios-mas-reservados`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener horarios más reservados';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener horarios más reservados:', error);
        throw error;
    }
};