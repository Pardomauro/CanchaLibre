import express from 'express';
import { pool } from '../config/db.js';
import { protegerRuta, verificarRol } from '../servicios/token.js';
import { enviarCorreoConfirmacionReserva, formatearFechaReserva } from '../utils/reenvio-confirmacion.js';
import { enviarCorreoCancelacionReserva } from '../utils/envio-cancelacion.js';
import {
    validarCampos,
    manejarErrorServidor,
    validacionesPaginacion,
    validacionesObtenerTurno,
    validacionesTurnosPorUsuario,
    validacionesDisponibilidadTurno,
    validacionesHorariosDisponibles,
    validacionesTurnosPorFecha,
    validacionesCrearTurno,
    validacionesActualizarTurno,
    validacionesEliminarTurno
} from '../middlewares/index.js';
import { convertirFechaMySQL, validarDisponibilidadHorario, validarCamposActualizacion, parsearHorarios } from '../middlewares/helpers.js';

const router = express.Router();
const ESTADOS_QUE_BLOQUEAN_DISPONIBILIDAD = ['pendiente de pago', 'reservado'];

const convertirHoraAMinutos = (hora) => {
    const [horas, minutos] = String(hora || '').split(':').map(Number);
    if (Number.isNaN(horas) || Number.isNaN(minutos)) return null;
    return horas * 60 + minutos;
};

const convertirMinutosAHora = (totalMinutos) => {
    const minutosNormalizados = totalMinutos % (24 * 60);
    const horas = Math.floor(minutosNormalizados / 60);
    const minutos = minutosNormalizados % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

const normalizarHorarioCancha = (horario, duracionMinutos) => {
    const [inicio, finConfigurado] = String(horario || '').split('-').map(parte => parte.trim());
    const inicioMinutos = convertirHoraAMinutos(inicio);

    if (inicioMinutos === null) return null;

    const finMinutosConfigurado = finConfigurado ? convertirHoraAMinutos(finConfigurado) : null;
    let duracionConfigurada = duracionMinutos;

    if (finMinutosConfigurado !== null) {
        const finAjustado = finMinutosConfigurado <= inicioMinutos
            ? finMinutosConfigurado + (24 * 60)
            : finMinutosConfigurado;
        duracionConfigurada = finAjustado - inicioMinutos;
    }

    if (duracionConfigurada !== duracionMinutos) return null;

    const fin = finConfigurado || convertirMinutosAHora(inicioMinutos + duracionMinutos);

    return {
        horario: `${inicio}-${fin}`,
        hora: inicio
    };
};

// Las funciones formatearFechaReserva y enviarCorreoConfirmacionReserva
// ahora se importan desde utils/reenvio-confirmacion.js

const obtenerEmailYNombreUsuario = async (idUsuario) => {
    if (!idUsuario) {
        return { email: null, nombre: null };
    }

    const [usuarios] = await pool.query(
        'SELECT email, nombre FROM usuarios WHERE id_usuario = ?',
        [idUsuario]
    );

    if (usuarios.length === 0) {
        return { email: null, nombre: null };
    }

    return {
        email: usuarios[0].email || null,
        nombre: usuarios[0].nombre || null
    };
};

// Ruta para obtener todos los turnos con paginación
router.get('/', [
    protegerRuta,
    ...validacionesPaginacion,
    validarCampos
], async (req, res) => {
    try {
        const { pagina = 1, limite = 10 } = req.query; // Valores predeterminados
        const offset = (pagina - 1) * limite;

        const [filas] = await pool.query(
            `SELECT 
                t.id_turno, 
                t.id_usuario, 
                t.id_cancha, 
                t.fecha_turno, 
                t.duracion, 
                t.precio, 
                t.estado, 
                t.fecha_creacion, 
                t.fecha_actualizacion,
                u.nombre as nombre_usuario,
                u.email as email_usuario,
                    u.celular as celular_usuario,
                c.tipo_cancha
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
             LEFT JOIN canchas c ON t.id_cancha = c.id
             ORDER BY t.fecha_turno DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limite), parseInt(offset)]
        );

        const [total] = await pool.query('SELECT COUNT(*) AS total FROM turnos');

        res.status(200).json({
            success: true,
            message: 'Turnos obtenidos correctamente',
            data: filas,
            total: total[0].total,
            pagina: parseInt(pagina),
            limite: parseInt(limite)
        });
    } catch (error) {
        return manejarErrorServidor(error, 'obtener turnos', res);
    }
});

// Ruta para obtener turnos por usuario
router.get('/usuario/:userId', [
    ...validacionesTurnosPorUsuario,
    validarCampos
], async (req, res) => {
    try {
        const { userId } = req.params;

        // Si es un administrador, devolver todas las reservas
        if (userId.startsWith('admin-')) {
            const [rows] = await pool.query(`SELECT
                t.id_turno,
                t.id_usuario,
                t.id_cancha,
                t.fecha_turno,
                t.duracion,
                t.precio,
                t.estado,
                t.fecha_creacion,
                t.fecha_actualizacion,
                u.nombre as nombre_usuario,
                u.email as email_usuario,
                u.celular as celular_usuario,
                c.tipo_cancha
            FROM turnos t
            LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
            LEFT JOIN canchas c ON t.id_cancha = c.id
            ORDER BY t.fecha_turno DESC`);

            return res.json({
                success: true,
                data: rows
            });
        }



        const [rows] = await pool.query(`SELECT
            t.id_turno,
            t.id_usuario,
            t.id_cancha,
            t.fecha_turno,
            t.duracion,
            t.precio,
            t.estado,
            t.fecha_creacion,
            t.fecha_actualizacion,
            u.nombre as nombre_usuario,
            u.email as email_usuario,
            u.celular as celular_usuario,
            c.tipo_cancha
        FROM turnos t
        LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
        LEFT JOIN canchas c ON t.id_cancha = c.id
        WHERE t.id_usuario = ?
        ORDER BY t.fecha_turno DESC`, [userId]);

        res.status(200).json({
            success: true,
            message: 'Turnos del usuario obtenidos correctamente',
            data: rows
        });
    } catch (error) {
        return manejarErrorServidor(error, 'obtener turnos del usuario', res);
    }
});

// Ruta para obtener un turno por ID
router.get('/:id', [
    ...validacionesObtenerTurno,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;

            const [rows] = await pool.query(`SELECT
                t.id_turno,
                t.id_usuario,
                t.id_cancha,
                t.fecha_turno,
                t.duracion,
                t.precio,
                t.estado,
                t.fecha_creacion,
                t.fecha_actualizacion,
                u.nombre as nombre_usuario,
                u.email as email_usuario,
                u.celular as celular_usuario,
                c.tipo_cancha
            FROM turnos t
            LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
            LEFT JOIN canchas c ON t.id_cancha = c.id
            WHERE t.id_turno = ?`, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Turno obtenido correctamente',
            data: rows[0]
        });
    } catch (error) {
        return manejarErrorServidor(error, 'obtener turno específico', res);
    }
});


// Ruta para verificar disponibilidad de una cancha
router.get('/disponibilidad/:id_cancha/:fecha/:hora', [
    ...validacionesDisponibilidadTurno,
    validarCampos
], async (req, res) => {
    try {
        const { id_cancha, fecha, hora } = req.params;

        console.log('🔍 Verificando disponibilidad:', { id_cancha, fecha, hora });

        // Crear la fecha y hora completa
        const fechaHoraInicio = `${fecha} ${hora}:00`;

        // Verificar si hay turnos en esa cancha y horario (considerando duraciones)
        const [turnos] = await pool.query(
            `SELECT id_turno, fecha_turno, duracion 
             FROM turnos 
             WHERE id_cancha = ? 
             AND DATE(fecha_turno) = ? 
             AND estado IN (?)`,
            [id_cancha, fecha, ESTADOS_QUE_BLOQUEAN_DISPONIBILIDAD]
        );

        // Verificar conflictos de horario
        const horaInicio = new Date(`${fecha} ${hora}:00`);
        let disponible = true;

        console.log('📅 Turnos existentes:', turnos.length);
        console.log('🕐 Hora solicitada:', horaInicio);

        for (let turno of turnos) {
            const turnoInicio = new Date(turno.fecha_turno);
            const turnoFin = new Date(turnoInicio.getTime() + (turno.duracion * 60000)); // duracion en minutos

            console.log('⏰ Comparando con turno:', {
                turnoInicio: turnoInicio,
                turnoFin: turnoFin,
                duracion: turno.duracion
            });

            // Si el horario solicitado está dentro del rango de otro turno
            if (horaInicio >= turnoInicio && horaInicio < turnoFin) {
                console.log('❌ Conflicto encontrado');
                disponible = false;
                break;
            }
        }

        console.log('✅ Resultado disponibilidad:', disponible);

        res.status(200).json({
            exito: true,
            disponible: disponible,
            mensaje: disponible ? 'La cancha está disponible' : 'La cancha no está disponible en ese horario'
        });

    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno al verificar disponibilidad',
            error: error.message
        });
    }
});

// Función auxiliar para obtener horarios disponibles
const obtenerHorariosDisponiblesHandler = async (req, res) => {
    try {
        const { id_cancha, fecha, duracion } = req.params;
        const duracionMinutos = parseInt(duracion) || 60; // Default: 60 minutos



        // Verificar que la cancha existe y no está en mantenimiento
        const [canchaData] = await pool.query(
            'SELECT id, horarios_disponibles FROM canchas WHERE id = ? AND en_mantenimiento = false',
            [id_cancha]
        );

        if (canchaData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada o en mantenimiento'
            });
        }

        // Generar horarios dinámicos según la duración
        const horariosCancha = parsearHorarios(canchaData[0].horarios_disponibles)
            .map(horario => normalizarHorarioCancha(horario, duracionMinutos))
            .filter(Boolean);
        /*
        const generarHorariosDinamicos = (duracionMinutos) => {
            const horarios = [];
            const horaInicio = 8; // 8:00 AM
            const horaFin = 24; // 12:00 AM (medianoche)
            const intervalos = duracionMinutos / 60; // Convertir a horas

            for (let hora = horaInicio; hora < horaFin; hora += intervalos) {
                const horaInicioStr = `${Math.floor(hora).toString().padStart(2, '0')}:${((hora % 1) * 60).toString().padStart(2, '0')}`;
                let horaFinCalculada = hora + intervalos;

                // Manejar el caso especial de medianoche
                let horaFinStr;
                if (horaFinCalculada >= 24) {
                    horaFinStr = '00:00';
                } else {
                    horaFinStr = `${Math.floor(horaFinCalculada).toString().padStart(2, '0')}:${(((horaFinCalculada) % 1) * 60).toString().padStart(2, '0')}`;
                }

                // Verificar que no se pase de la hora límite
                if (hora + intervalos <= horaFin) {
                    horarios.push(`${horaInicioStr}-${horaFinStr}`);
                }
            }

            return horarios;
        };

        horariosCancha = generarHorariosDinamicos(duracionMinutos);
        */

        if (horariosCancha.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No hay horarios configurados para la duracion seleccionada',
                data: {
                    fecha: fecha,
                    id_cancha: id_cancha,
                    horarios_disponibles: [],
                    horarios_ocupados: [],
                    total_disponibles: 0,
                    total_ocupados: 0
                }
            });
        }

        // Obtener turnos reservados para esa fecha
        const [turnosReservados] = await pool.query(
            `SELECT fecha_turno, duracion 
             FROM turnos 
             WHERE id_cancha = ? 
             AND DATE(fecha_turno) = ? 
             AND estado IN (?)`,
            [id_cancha, fecha, ESTADOS_QUE_BLOQUEAN_DISPONIBILIDAD]
        );

        // Filtrar horarios disponibles
        const horariosDisponibles = [];
        const horariosOcupados = [];

        for (let horario of horariosCancha) {
            let horaInicio = horario.hora;
            if (!horaInicio) continue;

            const fechaHoraCompleta = `${fecha} ${horaInicio}:00`;
            const horaInicioDate = new Date(fechaHoraCompleta);
            const horaFinDate = new Date(horaInicioDate.getTime() + (duracionMinutos * 60000));

            let disponible = true;

            // Verificar si este horario está ocupado
            for (let turno of turnosReservados) {
                const turnoInicio = new Date(turno.fecha_turno);
                const turnoFin = new Date(turnoInicio.getTime() + (turno.duracion * 60000));

                // Si hay solapamiento, el horario no está disponible
                if (horaInicioDate < turnoFin && horaFinDate > turnoInicio) {
                    disponible = false;
                    break;
                }
            }

            if (disponible) {
                horariosDisponibles.push({
                    horario: horario.horario,
                    hora: horaInicio,
                    disponible: true
                });
            } else {
                horariosOcupados.push({
                    horario: horario.horario,
                    hora: horaInicio,
                    disponible: false
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Horarios obtenidos correctamente',
            data: {
                fecha: fecha,
                id_cancha: id_cancha,
                horarios_disponibles: horariosDisponibles,
                horarios_ocupados: horariosOcupados,
                total_disponibles: horariosDisponibles.length,
                total_ocupados: horariosOcupados.length
            }
        });

    } catch (error) {
        console.error('Error al obtener horarios disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener horarios disponibles',
            error: error.message
        });
    }
};

// Rutas para obtener horarios disponibles de una cancha en una fecha específica
router.get('/horarios-disponibles/:id_cancha/:fecha/:duracion', [
    ...validacionesHorariosDisponibles,
    validarCampos
], obtenerHorariosDisponiblesHandler);

router.get('/horarios-disponibles/:id_cancha/:fecha', [
    ...validacionesHorariosDisponibles,
    validarCampos
], obtenerHorariosDisponiblesHandler);

// Ruta para obtener turnos por fecha 
router.get('/fecha/:fecha', [
    ...validacionesTurnosPorFecha,
    validarCampos
], async (req, res) => {
    try {
        const { fecha } = req.params;

        // Calcular el inicio y fin del día
        const inicioDia = `${fecha} 00:00:00`;
        const finDia = `${fecha} 23:59:59`;

        const [filas] = await pool.query(
            `SELECT id_turno, id_usuario, id_cancha, fecha_turno, duracion, precio, estado, fecha_creacion, fecha_actualizacion
             FROM turnos
             WHERE fecha_turno BETWEEN ? AND ?`,
            [inicioDia, finDia]
        );

        res.status(200).json({
            exito: true,
            mensaje: 'Turnos obtenidos correctamente',
            total: filas.length,
            datos: filas
        });
    } catch (error) {
        console.error('Error al obtener los turnos por fecha:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno al obtener los turnos por fecha',
            error: error.message
        });
    }
});


// Ruta para crear un nuevo turno 
router.post('/', [
    protegerRuta,
    ...validacionesCrearTurno,
    validarCampos
], async (req, res) => {
    try {
        console.log('Datos recibidos para crear turno:', req.body);
        const { id_usuario, id_cancha, fecha_turno, duracion, precio, estado, email, nombre } = req.body;

        // Convertir fecha manteniendo la zona horaria local
        const fechaMysql = convertirFechaMySQL(fecha_turno);
        console.log('Fecha original:', fecha_turno);
        console.log('Fecha convertida para MySQL:', fechaMysql);

        // Validar que se proporcionen todos los campos necesarios (id_usuario es opcional)
        if (!id_cancha || !fecha_turno || !duracion || !precio || !estado) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios (excepto id_usuario)'
            });
        }

        // Validar que el ID de cancha sea número, id_usuario es opcional
        if (isNaN(id_cancha) || (id_usuario && isNaN(id_usuario))) {
            return res.status(400).json({
                success: false,
                message: 'ID de cancha inválido o ID de usuario inválido'
            });
        }

        // Validar que la fecha del turno sea válida
        const fecha = new Date(fecha_turno);
        if (isNaN(fecha.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Fecha de turno inválida'
            });
        }

        // Validar que la duración sea un número positivo
        if (duracion <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La duración debe ser un número positivo'
            });
        }

        // Validar que el precio sea un número positivo
        if (precio < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un número positivo'
            });
        }

        // Validar que el estado sea uno de los valores permitidos
        const estadosPermitidos = ['pendiente de pago', 'reservado', 'cancelado', 'completado'];
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                success: false, 
                message: 'El estado debe ser uno de los valores permitidos: pendiente de pago, reservado, cancelado, completado'
            });
        }

        // VALIDAR DISPONIBILIDAD DE LA CANCHA (Solo para usuarios normales, no para admins)
        // Los administradores pueden crear reservas sin validar disponibilidad
        console.log('🔍 Usuario que crea la reserva:', req.usuario);
        console.log('🔍 Es administrador?:', req.usuario?.rol === 'administrador');

        if (ESTADOS_QUE_BLOQUEAN_DISPONIBILIDAD.includes(estado) && req.usuario?.rol !== 'administrador') {
            // Solo validar disponibilidad para usuarios normales
            const fechaSolo = fechaMysql.split(' ')[0]; // Extraer solo la fecha (YYYY-MM-DD)

            const [turnosExistentes] = await pool.query(
                `SELECT id_turno, fecha_turno, duracion 
                 FROM turnos 
                 WHERE id_cancha = ? 
                 AND DATE(fecha_turno) = ? 
                 AND estado IN (?)`,
                [id_cancha, fechaSolo, ESTADOS_QUE_BLOQUEAN_DISPONIBILIDAD]
            );

            // Verificar conflictos de horario usando función auxiliar
            const turnoInicio = new Date(fechaMysql);
            if (!validarDisponibilidadHorario(turnosExistentes, turnoInicio, duracion)) {
                return res.status(400).json({
                    success: false,
                    message: 'La cancha no está disponible en el horario solicitado'
                });
            }
        } else if (req.usuario?.rol === 'administrador') {
            console.log('✅ Administrador creando reserva - omitiendo validación de disponibilidad');
        }


        // Insertar el nuevo turno en la base de datos
        // Determinar el usuario final según el rol
        let idUsuarioFinal = null;
        const esAdministrador = req.usuario?.rol === 'administrador';
        const usuarioAutenticadoId = req.usuario?.id || req.usuario?.userId || null;

        if (esAdministrador) {
            // ADMINISTRADOR: puede crear reservas para otros usuarios
            if (email) {
                // Buscar usuario por email
                const [usuarioExistente] = await pool.query(
                    'SELECT id_usuario FROM usuarios WHERE email = ?',
                    [email]
                );

                if (usuarioExistente.length > 0) {
                    idUsuarioFinal = usuarioExistente[0].id_usuario;
                    console.log('✅ Admin - Usuario encontrado por email:', email, '- ID:', idUsuarioFinal);
                } else {
                    // Crear usuario temporal si no existe
                    const passwordTemporal = Math.random().toString(36).slice(-8);
                    const [nuevoUsuario] = await pool.query(
                        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
                        [nombre || 'Cliente', email, passwordTemporal, 'usuario']
                    );
                    idUsuarioFinal = nuevoUsuario.insertId;
                    console.log('✅ Admin - Usuario creado temporalmente:', email, '- ID:', idUsuarioFinal);
                }
            } else if (id_usuario) {
                idUsuarioFinal = id_usuario;
            } else {
                idUsuarioFinal = usuarioAutenticadoId;
            }
        } else {
            // USUARIO NORMAL: solo puede crear reservas para sí mismo
            idUsuarioFinal = usuarioAutenticadoId;
            
            // Validar que el email proporcionado corresponda al usuario autenticado
            if (email && usuarioAutenticadoId) {
                const [usuarioAuth] = await pool.query(
                    'SELECT email FROM usuarios WHERE id_usuario = ?',
                    [usuarioAutenticadoId]
                );
                
                if (usuarioAuth.length > 0) {
                    const emailRegistrado = usuarioAuth[0].email.toLowerCase();
                    const emailIngresado = email.toLowerCase();
                    
                    if (emailRegistrado !== emailIngresado) {
                        return res.status(400).json({
                            success: false,
                            message: 'El email proporcionado no corresponde a tu usuario. Usá el email con el que te registraste.'
                        });
                    }
                    console.log('✅ Email validado correctamente para usuario:', emailIngresado);
                }
            }
        }

        if (!idUsuarioFinal) {
            return res.status(400).json({
                success: false,
                message: 'No se pudo determinar el usuario de la reserva'
            });
        }

        const estadoFinal = esAdministrador ? estado : 'pendiente de pago';

        // Obtener el tipo de cancha desde la tabla canchas para almacenarlo en el turno
        const [canchaTipoRows] = await pool.query(
            'SELECT tipo_cancha FROM canchas WHERE id = ?',
            [id_cancha]
        );
        const tipo_cancha_turno = canchaTipoRows[0]?.tipo_cancha || 'Padel';

        const [result] = await pool.query(`INSERT INTO turnos
            (id_usuario, id_cancha, fecha_turno, duracion, precio, estado, tipo_cancha)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [idUsuarioFinal, id_cancha, fechaMysql, duracion, precio, estadoFinal, tipo_cancha_turno]);

        const debeEnviarConfirmacion = estadoFinal === 'reservado' && (email || esAdministrador);

        // Enviar correo de confirmación solo cuando la reserva queda confirmada (sin bloquear la respuesta)
        if (debeEnviarConfirmacion) {
            try {
                const emailDestinatario = email || null;
                if (emailDestinatario) {
                    // Usar el tipo de cancha ya obtenido al insertar el turno
                    await enviarCorreoConfirmacionReserva({
                        email: emailDestinatario,
                        nombre,
                        id_cancha,
                        fechaMysql,
                        precio,
                        tipo_cancha: tipo_cancha_turno || 'No especificado'
                    });
                    console.log('✅ Correo de confirmación enviado a:', emailDestinatario);
                }
            } catch (emailError) {
                console.error('❌ Error enviando correo de confirmación:', emailError);
                // Continuar sin fallar la creación del turno
            }
        } else {
            console.log('ℹ️ No se envió correo de confirmación (reserva pendiente o email no disponible)');
        }

        res.status(201).json({
            success: true,
            message: 'Turno creado exitosamente',
            id_turno: result.insertId
        });

    } catch (error) {
        return manejarErrorServidor(error, 'crear turno', res);
    }
});

// Ruta explícita para confirmar una reserva pendiente y enviar el correo al instante
router.post('/:id/confirmar', [
    protegerRuta,
    verificarRol(['administrador']),
    ...validacionesObtenerTurno,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;

        const [turnoRows] = await pool.query(
            `SELECT t.id_turno, t.id_usuario, t.id_cancha, t.fecha_turno, t.duracion, t.precio, t.estado,
                    u.email as email_usuario, u.nombre as nombre_usuario, u.celular as celular_usuario, c.tipo_cancha
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
             LEFT JOIN canchas c ON t.id_cancha = c.id
             WHERE t.id_turno = ?`,
            [id]
        );

        if (turnoRows.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Turno no encontrado'
            });
        }

        const turnoAnterior = turnoRows[0];

        if (turnoAnterior.estado === 'reservado') {
            return res.status(200).json({
                exito: true,
                mensaje: 'La reserva ya estaba confirmada',
                correo_enviado: false
            });
        }

        await pool.query(
            'UPDATE turnos SET estado = ?, fecha_actualizacion = NOW() WHERE id_turno = ?',
            ['reservado', id]
        );

        const [turnoActualizadoRows] = await pool.query(
            `SELECT t.id_turno, t.id_usuario, t.id_cancha, t.fecha_turno, t.duracion, t.precio, t.estado,
                    u.email as email_usuario, u.nombre as nombre_usuario, u.celular as celular_usuario, c.tipo_cancha
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
             LEFT JOIN canchas c ON t.id_cancha = c.id
             WHERE t.id_turno = ?`,
            [id]
        );

        const turnoActualizado = turnoActualizadoRows[0] || turnoAnterior;
        const emailYNombreFallback = await obtenerEmailYNombreUsuario(turnoActualizado.id_usuario);
        const emailDestino = turnoActualizado.email_usuario || emailYNombreFallback.email;
        const nombreDestino = turnoActualizado.nombre_usuario || emailYNombreFallback.nombre;
        let correoEnviado = false;

        console.log('🔁 Confirmación explícita de reserva:', {
            id_turno: turnoActualizado.id_turno,
            estado_anterior: turnoAnterior.estado,
            estado_nuevo: turnoActualizado.estado,
            email: emailDestino
        });

        if (emailDestino) {
            try {
                console.log('✉️ Enviando correo inmediato de confirmación...');
                await enviarCorreoConfirmacionReserva({
                    email: emailDestino,
                    nombre: nombreDestino,
                    id_cancha: turnoActualizado.id_cancha,
                    fechaMysql: turnoActualizado.fecha_turno,
                    precio: turnoActualizado.precio,
                    tipo_cancha: turnoActualizado.tipo_cancha
                });
                correoEnviado = true;
                console.log('✅ Correo inmediato enviado a:', emailDestino);
            } catch (emailError) {
                console.error('❌ Error enviando correo inmediato de confirmación:', emailError);
            }
        }

        return res.status(200).json({
            exito: true,
            mensaje: 'Reserva confirmada exitosamente',
            correo_enviado: correoEnviado
        });
    } catch (error) {
        return manejarErrorServidor(error, 'confirmar reserva', res);
    }
});

// Ruta para actualizar un turno por ID

// Permitir actualizaciones parciales en PUT /:id
router.put('/:id', [
    protegerRuta,
    ...validacionesActualizarTurno,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;
        const { id_usuario, id_cancha, fecha_turno, duracion, precio, estado } = req.body;

        const [turnoAnteriorRows] = await pool.query(
            `SELECT t.id_turno, t.id_usuario, t.id_cancha, t.fecha_turno, t.duracion, t.precio, t.estado,
                    u.email as email_usuario, u.nombre as nombre_usuario, u.celular as celular_usuario, c.tipo_cancha
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
             LEFT JOIN canchas c ON t.id_cancha = c.id
             WHERE t.id_turno = ?`,
            [id]
        );

        if (turnoAnteriorRows.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Turno no encontrado'
            });
        }

        const turnoAnterior = turnoAnteriorRows[0];

        // Construir dinámicamente la consulta de actualización
        const campos = [];
        const valores = [];

        if (id_usuario) {
            campos.push('id_usuario = ?');
            valores.push(id_usuario);
        }
        if (id_cancha) {
            campos.push('id_cancha = ?');
            valores.push(id_cancha);
        }
        if (fecha_turno) {
            campos.push('fecha_turno = ?');
            valores.push(fecha_turno);
        }
        if (duracion) {
            campos.push('duracion = ?');
            valores.push(duracion);
        }
        if (precio) {
            campos.push('precio = ?');
            valores.push(precio);
        }
        if (estado) {
            campos.push('estado = ?');
            valores.push(estado);
        }

        // Validar que al menos un campo sea enviado para actualizar
        const camposPermitidos = ['id_usuario', 'id_cancha', 'fecha_turno', 'duracion', 'precio', 'estado'];
        if (!validarCamposActualizacion(req.body, camposPermitidos)) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        const consulta = `UPDATE turnos SET ${campos.join(', ')} WHERE id_turno = ?`;
        valores.push(id);

        const [resultado] = await pool.query(consulta, valores);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Turno no encontrado'
            });
        }

        const [turnoActualizadoRows] = await pool.query(
            `SELECT t.id_turno, t.id_usuario, t.id_cancha, t.fecha_turno, t.duracion, t.precio, t.estado,
                    u.email as email_usuario, u.nombre as nombre_usuario, u.celular as celular_usuario, c.tipo_cancha
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
             LEFT JOIN canchas c ON t.id_cancha = c.id
             WHERE t.id_turno = ?`,
            [id]
        );

        const turnoActualizado = turnoActualizadoRows[0] || turnoAnterior;
        const emailYNombreFallback = await obtenerEmailYNombreUsuario(turnoActualizado.id_usuario);
        const emailDestino = turnoActualizado.email_usuario || emailYNombreFallback.email;
        const nombreDestino = turnoActualizado.nombre_usuario || emailYNombreFallback.nombre;

        const cambioAConfirmado = turnoAnterior.estado === 'pendiente de pago' && turnoActualizado.estado === 'reservado';
        console.log('🔁 Estado anterior:', turnoAnterior.estado, '-> Estado actualizado:', turnoActualizado.estado);
        console.log('📧 Email objetivo al confirmar:', emailDestino);
        if (cambioAConfirmado) {
            try {
                console.log('✉️ Intentando enviar correo de confirmación...');
                const enviado = await enviarCorreoConfirmacionReserva({
                    email: emailDestino,
                    nombre: nombreDestino,
                    id_cancha: turnoActualizado.id_cancha,
                    fechaMysql: turnoActualizado.fecha_turno,
                    precio: turnoActualizado.precio,
                    tipo_cancha: turnoActualizado.tipo_cancha
                });
                console.log('✅ Resultado envío confirmación:', enviado, '-> destinatario:', emailDestino);
            } catch (emailError) {
                console.error('❌ Error enviando correo al confirmar turno:', emailError);
            }
        } else {
            console.log('ℹ️ No se cumplió la condición de cambio a confirmado (no se envía correo).');
        }

        res.json({
            exito: true,
            mensaje: 'Turno actualizado exitosamente'
        });
    } catch (error) {
        return manejarErrorServidor(error, 'actualizar turno', res);
    }
});

// Ruta para eliminar un turno por ID
router.delete('/:id', [
    protegerRuta,
    verificarRol(['administrador']),
    ...validacionesEliminarTurno,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;

        // Primero obtener los datos del turno antes de eliminarlo
        const [turnoRows] = await pool.query(
            `SELECT t.id_turno, t.id_cancha, t.fecha_turno, t.duracion, t.precio, t.estado, 
                    u.email as email_usuario, u.nombre as nombre_usuario, u.celular as celular_usuario, c.tipo_cancha
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
             LEFT JOIN canchas c ON t.id_cancha = c.id
             WHERE t.id_turno = ?`,
            [id]
        );

        if (!turnoRows || turnoRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        const turno = turnoRows[0];

        // Enviar correo de cancelación si existe el email del usuario
        if (turno.email_usuario) {
            try {
                await enviarCorreoCancelacionReserva({
                    email: turno.email_usuario,
                    nombre: turno.nombre_usuario,
                    id_cancha: turno.id_cancha,
                    fechaMysql: turno.fecha_turno,
                    precio: turno.precio,
                    tipo_cancha: turno.tipo_cancha
                });

                console.log(`Correo de cancelación enviado a: ${turno.email_usuario}`);
            } catch (emailError) {
                console.error('Error al enviar correo de cancelación:', emailError);
                // Continuar con la eliminación aunque falle el correo
            }
        }

        // Eliminar el turno
        const [result] = await pool.query(`DELETE FROM turnos WHERE id_turno = ?`, [id]);

        res.json({
            success: true,
            message: 'Turno eliminado exitosamente y correo de cancelación enviado'
        });
    } catch (error) {
        return manejarErrorServidor(error, 'eliminar turno', res);
    }
});

export default router;
