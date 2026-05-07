// Utilidades para validaciones de formatos y datos

/**
 * Valida el formato de un email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si el formato es válido, false en caso contrario
 */
export const validarEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valida el celular (solo dígitos, longitud entre 7 y 15)
 * @param {string} celular - Celular a validar
 * @return {boolean} - true si el formato es válido, false en caso contrario
 * Ejemplo de formato válido: 3515606326
 */
export const validarCelular = (celular) => {
    const celularRegex = /^\d{7,15}$/;
    return celularRegex.test(celular);
};

/**
 * Valida el formato de una fecha (YYYY-MM-DD)
 * @param {string} fecha - Fecha a validar
 * @returns {boolean} - true si el formato es válido, false en caso contrario
 */
export const validarFormatoFecha = (fecha) => {
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) return false;
    
    // Verificar que sea una fecha válida
    const fechaObj = new Date(fecha);
    return fechaObj instanceof Date && !isNaN(fechaObj.getTime());
};

/**
 * Valida el formato de una hora (HH:MM)
 * @param {string} hora - Hora a validar
 * @returns {boolean} - true si el formato es válido, false en caso contrario
 */
export const validarFormatoHora = (hora) => {
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return horaRegex.test(hora);
};

/**
 * Valida el formato de fecha y hora completa (YYYY-MM-DD HH:MM:SS)
 * @param {string} fechaHora - Fecha y hora a validar
 * @returns {boolean} - true si el formato es válido, false en caso contrario
 */
export const validarFormatoFechaHora = (fechaHora) => {
    const fechaHoraRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!fechaHoraRegex.test(fechaHora)) return false;
    
    // Verificar que sea una fecha y hora válida
    const fechaObj = new Date(fechaHora);
    return fechaObj instanceof Date && !isNaN(fechaObj.getTime());
};

/**
 * Valida que un número sea positivo
 * @param {number} numero - Número a validar
 * @returns {boolean} - true si es positivo, false en caso contrario
 */
export const validarNumeroPositivo = (numero) => {
    return !isNaN(numero) && numero > 0;
};

/**
 * Valida que un string tenga una longitud mínima
 * @param {string} texto - Texto a validar
 * @param {number} longitudMinima - Longitud mínima requerida
 * @returns {boolean} - true si cumple la longitud mínima, false en caso contrario
 */
export const validarLongitudMinima = (texto, longitudMinima) => {
    return texto && texto.trim().length >= longitudMinima;
};

/**
 * Valida datos de usuario
 * @param {Object} usuario - Objeto usuario con propiedades nombre, email, password
 * @returns {Object} - Objeto con esValido (boolean) y errores (array)
 */
export const validarDatosUsuario = (usuario) => {
    const errores = [];

    if (!validarLongitudMinima(usuario.nombre, 2)) {
        errores.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!usuario.email || !validarEmail(usuario.email)) {
        errores.push('El formato del email no es válido');
    }

    if (usuario.password && !validarLongitudMinima(usuario.password, 6)) {
        errores.push('La contraseña debe tener al menos 6 caracteres');
    }

    return {
        esValido: errores.length === 0,
        errores: errores
    };
};

/**
 * Valida datos de reserva/turno
 * @param {Object} reserva - Objeto reserva con propiedades del turno
 * @returns {Object} - Objeto con esValido (boolean) y errores (array)
 */
export const validarDatosReserva = (reserva) => {
    const errores = [];

    if (!reserva.id_usuario || isNaN(reserva.id_usuario)) {
        errores.push('ID de usuario inválido');
    }

    if (!reserva.id_cancha || isNaN(reserva.id_cancha)) {
        errores.push('ID de cancha inválido');
    }

    if (!reserva.fecha_turno || !validarFormatoFechaHora(reserva.fecha_turno)) {
        errores.push('Fecha y hora del turno son obligatorias y deben tener formato válido (YYYY-MM-DD HH:MM:SS)');
    }

    if (!reserva.duracion || !validarNumeroPositivo(reserva.duracion)) {
        errores.push('La duración debe ser un número positivo (en minutos)');
    }

    if (reserva.precio !== undefined && reserva.precio < 0) {
        errores.push('El precio debe ser un número positivo');
    }

    if (!reserva.celular || !validarCelular(reserva.celular)) {
        errores.push('El celular es obligatorio y debe tener un formato válido');
    }

    const estadosPermitidos = ['reservado', 'cancelado', 'completado'];
    if (!reserva.estado || !estadosPermitidos.includes(reserva.estado)) {
        errores.push('El estado debe ser: reservado, cancelado o completado');
    }

    return {
        esValido: errores.length === 0,
        errores: errores
    };
};

/**
 * Valida datos de cancha
 * @param {Object} cancha - Objeto cancha con propiedades de la cancha
 * @returns {Object} - Objeto con esValido (boolean) y errores (array)
 */
export const validarDatosCancha = (cancha) => {
    const errores = [];

    if (!cancha.precio || !validarNumeroPositivo(cancha.precio)) {
        errores.push('El precio debe ser un número mayor a 0');
    }

    if (cancha.en_mantenimiento !== undefined && typeof cancha.en_mantenimiento !== 'boolean') {
        errores.push('El estado de mantenimiento debe ser true o false');
    }

    if (!cancha.horarios_disponibles || !Array.isArray(cancha.horarios_disponibles) || cancha.horarios_disponibles.length === 0) {
        errores.push('Debe proporcionar al menos un horario disponible');
    }

    return {
        esValido: errores.length === 0,
        errores: errores
    };
};