
// Peticiones http relacionadas con los usuarios

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Normaliza el token para asegurar que no tenga espacios, comillas o prefijo "Bearer"
const normalizarToken = (rawToken) => {
    if (rawToken === null || typeof rawToken === 'undefined') return null;

    let token = String(rawToken).trim();
    if (!token) return null;
    if (token === 'null' || token === 'undefined') return null;

    if (token.toLowerCase().startsWith('bearer ')) {
        token = token.slice('bearer '.length).trim();
    }

    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1).trim();
    }

    return token || null;
};

// Helper para crear headers con Authorization
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

// Función para obtener todos los usuarios (solo administrador)
export const obtenerUsuarios = async (tokenOverride) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'GET',
            headers: getAuthHeaders(tokenOverride)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener los usuarios';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener un usuario por ID (solo administrador)
export const obtenerUsuarioPorId = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener el usuario';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }
        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para crear un nuevo usuario (registro directo por admin)
// Para registro de usuarios normales, usar registrarUsuario en auth.js
export const crearUsuario = async (usuario) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(usuario)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al crear el usuario';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }
        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para actualizar un usuario existente (solo administrador)
// Campos opcionales: nombre, email, password
export const actualizarUsuario = async (id, datosUsuario) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(datosUsuario)
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al actualizar el usuario';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }
        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para eliminar un usuario (solo administrador)
export const eliminarUsuario = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al eliminar el usuario';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }
        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Función para obtener el perfil de un usuario específico
// Esta función también está disponible en auth.js como obtenerPerfilUsuario
export const obtenerPerfilUsuario = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await leerErrorRespuesta(response);
            const message = errorData?.message || 'Error al obtener el perfil del usuario';
            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }
        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Las funciones de validación están disponibles en ../utils
// Importar validarDatosUsuario si se necesita validar datos antes de enviarlos

