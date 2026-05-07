import { body, param } from 'express-validator';

/**
 * Validaciones para registrar un nuevo usuario (público)
 */
export const validacionesRegistroUsuario = [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('celular')
        .trim()
        .matches(/^\+?\d{7,15}$/)
        .withMessage('Número de celular inválido. Debe contener entre 7 y 15 dígitos, opcionalmente comenzando con +'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/\d/)
        .withMessage('La contraseña debe contener al menos un número')
        .matches(/[A-Z]/)
        .withMessage('La contraseña debe contener al menos una mayúscula')
];

/**
 * Validaciones para login de usuario
 */
export const validacionesLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

/**
 * Validaciones para crear usuario (solo admin)
 */
export const validacionesCrearUsuario = [
    body('nombre')
        .notEmpty()
        .withMessage('El nombre es requerido'),
    body('email')
        .isEmail()
        .withMessage('Email inválido'),
    body('celular')
        .trim()
        .matches(/^\+?\d{7,15}$/)
        .withMessage('Número de celular inválido. Debe contener entre 7 y 15 dígitos, opcionalmente comenzando con +'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
];

/**
 * Validaciones para obtener usuario específico
 */
export const validacionesObtenerUsuario = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número válido mayor a 0')
];

/**
 * Validaciones para actualizar usuario
 */
export const validacionesActualizarUsuario = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de usuario inválido'),
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('celular')
        .optional()
        .trim()
        .matches(/^\+?\d{7,15}$/)
        .withMessage('Número de celular inválido. Debe contener entre 7 y 15 dígitos, opcionalmente comenzando con +'),   
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/\d/)
        .withMessage('La contraseña debe contener al menos un número')
        .matches(/[A-Z]/)
        .withMessage('La contraseña debe contener al menos una mayúscula')
];

/**
 * Validaciones para eliminar usuario
 */
export const validacionesEliminarUsuario = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número válido mayor a 0')
];

/**
 * Validaciones para recuperación de contraseña
 */
export const validacionesRecuperarContrasena = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
];

/**
 * Validaciones para verificar código de recuperación
 */
export const validacionesVerificarCodigo = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('codigo')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('El código debe tener 6 dígitos')
        .isNumeric()
        .withMessage('El código debe contener solo números'),
    body('nuevaContrasena')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/\d/)
        .withMessage('La contraseña debe contener al menos un número')
        .matches(/[A-Z]/)
        .withMessage('La contraseña debe contener al menos una mayúscula')
];