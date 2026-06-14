import { body, param, query } from 'express-validator';

/**
 * Validaciones para obtener turnos con paginación
 */
export const validacionesPaginacion = [
    query('pagina')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0'),
    query('limite')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100')
];

/**
 * Validaciones para obtener turno por ID
 */
export const validacionesObtenerTurno = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número válido mayor a 0')
];

/**
 * Validaciones para obtener turnos por usuario
 */
export const validacionesTurnosPorUsuario = [
    param('userId')
        .custom((value) => {
            // Permitir "admin-*" o números válidos
            if (value.startsWith('admin-') || (!isNaN(value) && parseInt(value) > 0)) {
                return true;
            }
            throw new Error('ID de usuario inválido');
        })
];

/**
 * Validaciones para verificar disponibilidad
 */
export const validacionesDisponibilidadTurno = [
    param('id_cancha')
        .isInt({ min: 1 })
        .withMessage('ID de cancha inválido'),
    param('fecha')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('El formato de la fecha debe ser YYYY-MM-DD'),
    param('hora')
        .matches(/^\d{2}:\d{2}$/)
        .withMessage('El formato de la hora debe ser HH:MM')
];

/**
 * Validaciones para obtener horarios disponibles
 */
export const validacionesHorariosDisponibles = [
    param('id_cancha')
        .isInt({ min: 1 })
        .withMessage('ID de cancha inválido'),
    param('fecha')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('El formato de la fecha debe ser YYYY-MM-DD'),
    param('duracion')
        .optional()
        .isInt({ min: 30, max: 180 })
        .withMessage('La duración debe estar entre 30 y 180 minutos')
];

/**
 * Validaciones para obtener turnos por fecha
 */
export const validacionesTurnosPorFecha = [
    param('fecha')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('El formato de la fecha debe ser YYYY-MM-DD')
];

/**
 * Validaciones para crear turno
 */
export const validacionesCrearTurno = [
    body('id_usuario')
        .optional({ nullable: true })
        .custom((value) => {
            console.log('🔍 Validando id_usuario:', value, typeof value);
            if (value !== null && value !== undefined && (isNaN(value) || parseInt(value) < 1)) {
                throw new Error('ID de usuario inválido');
            }
            return true;
        }),
    body('id_cancha')
        .custom((value) => {
            console.log('🔍 Validando id_cancha:', value, typeof value);
            const id = parseInt(value);
            if (isNaN(id) || id < 1) {
                throw new Error('ID de cancha inválido');
            }
            return true;
        }),
    body('fecha_turno')
        .custom((value) => {
            console.log('🔍 Validando fecha_turno:', value);
            const fecha = new Date(value);
            if (isNaN(fecha.getTime())) {
                throw new Error('Fecha de turno inválida');
            }
            // Para administradores, permitir fechas pasadas
            // Validar que la fecha no sea en el pasado solo para usuarios normales
            const ahora = new Date();
            console.log('📅 Fecha turno:', fecha);
            console.log('📅 Ahora:', ahora);
            console.log('📅 Es pasado?:', fecha < ahora);

            // Comentamos temporalmente esta validación para permitir al admin crear reservas
            // if (fecha < ahora) {
            //     throw new Error('La fecha del turno no puede ser en el pasado');
            // }
            return true;
        }),
    body('duracion')
        .custom((value) => {
            console.log('🔍 Validando duracion:', value, typeof value);
            const duracion = parseInt(value);
            if (isNaN(duracion) || duracion < 30 || duracion > 180) {
                throw new Error('La duración debe estar entre 30 y 180 minutos');
            }
            return true;
        }),
    body('precio')
        .custom((value) => {
            console.log('🔍 Validando precio:', value, typeof value);
            const precio = parseFloat(value);
            if (isNaN(precio) || precio < 0) {
                throw new Error('El precio debe ser un número positivo');
            }
            return true;
        }),
    body('estado')
        .isIn(['pendiente de pago', 'reservado', 'cancelado', 'completado'])
        .withMessage('Estado inválido'),
    body('email')
        .optional()
        .custom((value) => {
            console.log('🔍 Validando email:', value, typeof value);
            if (value && (typeof value !== 'string' || !value.includes('@'))) {
                throw new Error('Email inválido');
            }
            return true;
        }),
    body('nombre')
        .optional()
        .custom((value) => {
            console.log('🔍 Validando nombre:', value, typeof value);
            if (value && (typeof value !== 'string' || value.trim().length === 0)) {
                throw new Error('El nombre no puede estar vacío');
            }
            return true;
        }),
    body('tipo_cancha')
        .isIn(['Futbol', 'Padel', 'Tenis', 'Otra'])
        .withMessage('El tipo de cancha debe ser: Futbol, Padel, Tenis u Otra')
];

/**
 * Validaciones para actualizar turno
 */
export const validacionesActualizarTurno = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de turno inválido'),
    body('id_usuario')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de usuario inválido'),
    body('id_cancha')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de cancha inválido'),
    body('fecha_turno')
        .optional()
        .isISO8601()
        .withMessage('Fecha de turno inválida'),
    body('duracion')
        .optional()
        .isInt({ min: 30, max: 180 })
        .withMessage('La duración debe estar entre 30 y 180 minutos'),
    body('precio')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio debe ser un número positivo'),
    body('estado')
        .optional()
        .isIn(['pendiente de pago', 'reservado', 'cancelado', 'completado'])
        .withMessage('Estado inválido'),
    body('tipo_cancha')
        .optional()
        .isIn(['Futbol', 'Padel', 'Tenis', 'Otra'])
        .withMessage('El tipo de cancha debe ser: Futbol, Padel, Tenis u Otra')
];

/**
 * Validaciones para eliminar turno
 */
export const validacionesEliminarTurno = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de turno inválido')
];