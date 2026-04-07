// Middlewares de validación común
export { validarCampos, validarId, manejarErrorServidor } from './validation.js';

// Validaciones específicas de Canchas
export {
    validacionesCrearCancha,
    validacionesActualizarCancha,
    validacionesObtenerCancha,
    validacionesEliminarCancha,
    validacionesDisponibilidad
} from './canchasValidation.js';

// Validaciones específicas de Usuarios
export {
    validacionesRegistroUsuario,
    validacionesLogin,
    validacionesCrearUsuario,
    validacionesObtenerUsuario,
    validacionesActualizarUsuario,
    validacionesEliminarUsuario,
    validacionesRecuperarContrasena,
    validacionesVerificarCodigo
} from './usuariosValidation.js';

// Validaciones específicas de Turnos
export {
    validacionesPaginacion,
    validacionesObtenerTurno,
    validacionesTurnosPorUsuario,
    validacionesDisponibilidadTurno,
    validacionesHorariosDisponibles,
    validacionesTurnosPorFecha,
    validacionesCrearTurno,
    validacionesActualizarTurno,
    validacionesEliminarTurno
} from './turnosValidation.js';

// Funciones auxiliares
export {
    parsearHorarios,
    validarCamposActualizacion,
    validarEmail,
    convertirFechaMySQL,
    validarDisponibilidadHorario
} from './helpers.js';