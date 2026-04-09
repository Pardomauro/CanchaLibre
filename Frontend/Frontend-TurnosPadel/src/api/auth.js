// API para la autenticación de usuarios 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Función para iniciar sesión
export const loginUsuario = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();

            if (data.success) {
                return {
                    token: data.token,
                    userId: data.userId,
                    role: data.role
                };
            } else {
                throw new Error(data.message || 'Error en el login');
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la solicitud de login');
        }
    } catch (error) {
        console.error('Error en la función loginUsuario:', error);
        throw error;
    }
};

// Función para gestión de Registro de Usuarios
export const registrarUsuario = async (nombre, email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/registrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password })
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            console.error('Error response from server:', response.status, errorData);
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error en la función registrarUsuario:', error);
        throw error;
    }
};

// Función para recuperación de contraseña (enviar email con token)
export const recuperarContrasena = async (email) => {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/recuperar-contrasena`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Error en la solicitud de recuperación de contraseña');
        }
    } catch (error) {
        console.error('Error en la función recuperarContrasena:', error);
        throw error;
    }
};

// NOTA: La función obtenerPerfilUsuario se movió a usuarios.js
// para mantener mejor organización del código (funciones CRUD de usuarios)
