import { body, param } from 'express-validator';

/**
 * Validaciones para crear una nueva cancha
 */
export const validacionesCrearCancha = [
    body('precio')
        .isFloat({ min: 0.01 })
        .withMessage('El precio debe ser un número mayor a 0'),
    body('en_mantenimiento')
        .optional()
        .isBoolean()
        .withMessage('El estado de mantenimiento debe ser true o false'),
    body('horarios_disponibles')
        .isArray()
        .withMessage('Los horarios disponibles deben ser un array')
        .notEmpty()
        .withMessage('Debe proporcionar al menos un horario disponible'),
    body('tipo_cancha')
        .isString()
        .notEmpty()
        .withMessage('El tipo de cancha es obligatorio')
];

/**
 * Validaciones para actualizar una cancha
 */
export const validacionesActualizarCancha = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número válido mayor a 0'),
    body('precio')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('El precio debe ser un número mayor a 0'),
    body('en_mantenimiento')
        .optional()
        .custom((value) => {
            // Permitir diferentes representaciones de boolean
            if (value === undefined || value === null) return true;
            if (typeof value === 'boolean') return true;
            if (value === 'true' || value === 'false') return true;
            if (value === 1 || value === 0) return true;
            throw new Error('El estado de mantenimiento debe ser true, false, 1, 0, "true" o "false"');
        })
        .toBoolean(), // Convertir automáticamente a boolean
    body('horarios_disponibles')
        .optional()
        .isArray()
        .withMessage('Los horarios disponibles deben ser un array')
        .custom((value) => {
            if (value && value.length === 0) {
                throw new Error('Debe proporcionar al menos un horario disponible');
            }
            return true;
        }),
    body('tipo_cancha')
        .optional()
        .isString()
        .notEmpty()
        .withMessage('El tipo de cancha no puede estar vacío si se proporciona')
];

/**
 * Validaciones para obtener una cancha específica
 */
export const validacionesObtenerCancha = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número válido mayor a 0')
];

/**
 * Validaciones para eliminar una cancha
 */
export const validacionesEliminarCancha = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número válido mayor a 0')
];

/**
 * Validaciones para verificar disponibilidad de turnos
 */
export const validacionesDisponibilidad = [
    body('fecha')
        .isISO8601()
        .withMessage('La fecha debe estar en formato ISO8601 (YYYY-MM-DD)'),
    body('horaInicio')
        .isString()
        .notEmpty()
        .withMessage('La hora de inicio es requerida'),
    body('horaFin')
        .isString()
        .notEmpty()
        .withMessage('La hora de fin es requerida'),
    body('id_cancha')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El ID de cancha debe ser un número válido')
];