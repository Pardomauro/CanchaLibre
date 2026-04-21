import express from 'express';
import { pool } from '../Config/db.js';
import { enviarCorreo } from '../Servicios/EmailServicio.js';
import { protegerRuta, verificarRol } from '../Servicios/token.js';
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
import { convertirFechaMySQL, validarDisponibilidadHorario, validarCamposActualizacion } from '../middlewares/helpers.js';

const router = express.Router();

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
                u.email as email_usuario
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
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
                u.email as email_usuario
            FROM turnos t
            LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
            ORDER BY t.fecha_turno DESC`);

            return res.json({
                success: true,
                data: rows
            });
        }



        const [rows] = await pool.query(`SELECT
            id_turno,
            id_usuario,
            id_cancha,
            fecha_turno,
            duracion,
            precio,
            estado,
            fecha_creacion,
            fecha_actualizacion
        FROM turnos
        WHERE id_usuario = ?
        ORDER BY fecha_turno DESC`, [userId]);

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
            id_turno,
            id_usuario,
            id_cancha,
            fecha_turno,
            duracion,
            precio,
            estado,
            fecha_creacion,
            fecha_actualizacion
        FROM turnos
        WHERE id_turno = ?`, [id]);

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
             AND estado = 'reservado'`,
            [id_cancha, fecha]
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
            'SELECT id FROM canchas WHERE id = ? AND en_mantenimiento = false',
            [id_cancha]
        );

        if (canchaData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada o en mantenimiento'
            });
        }

        // Generar horarios dinámicos según la duración
        let horariosCancha = [];
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

        // Obtener turnos reservados para esa fecha
        const [turnosReservados] = await pool.query(
            `SELECT fecha_turno, duracion 
             FROM turnos 
             WHERE id_cancha = ? 
             AND DATE(fecha_turno) = ? 
             AND estado = 'reservado'`,
            [id_cancha, fecha]
        );

        // Filtrar horarios disponibles
        const horariosDisponibles = [];
        const horariosOcupados = [];

        for (let horario of horariosCancha) {
            // Extraer hora de inicio del horario (formato: "08:00-09:30" o "08:00")
            let horaInicio = horario.split('-')[0];
            if (!horaInicio) continue;

            const fechaHoraCompleta = `${fecha} ${horaInicio}:00`;
            const horaInicioDate = new Date(fechaHoraCompleta);
            
            let disponible = true;

            // Verificar si este horario está ocupado
            for (let turno of turnosReservados) {
                const turnoInicio = new Date(turno.fecha_turno);
                const turnoFin = new Date(turnoInicio.getTime() + (turno.duracion * 60000));

                // Si hay solapamiento, el horario no está disponible
                if (horaInicioDate >= turnoInicio && horaInicioDate < turnoFin) {
                    disponible = false;
                    break;
                }
            }

            if (disponible) {
                horariosDisponibles.push({
                    horario: horario,
                    hora: horaInicio,
                    disponible: true
                });
            } else {
                horariosOcupados.push({
                    horario: horario,
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
        const estadosPermitidos = ['reservado', 'cancelado', 'completado'];
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'El estado debe ser uno de los valores permitidos: reservado, cancelado, completado'
            });
        }

        // VALIDAR DISPONIBILIDAD DE LA CANCHA (Solo para usuarios normales, no para admins)
        // Los administradores pueden crear reservas sin validar disponibilidad
        console.log('🔍 Usuario que crea la reserva:', req.usuario);
        console.log('🔍 Es administrador?:', req.usuario?.rol === 'administrador');
        
        if (estado === 'reservado' && req.usuario?.rol !== 'administrador') {
            // Solo validar disponibilidad para usuarios normales
            const fechaSolo = fechaMysql.split(' ')[0]; // Extraer solo la fecha (YYYY-MM-DD)
            
            const [turnosExistentes] = await pool.query(
                `SELECT id_turno, fecha_turno, duracion 
                 FROM turnos 
                 WHERE id_cancha = ? 
                 AND DATE(fecha_turno) = ? 
                 AND estado = 'reservado'`,
                [id_cancha, fechaSolo]
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
        // Si no hay id_usuario (reserva de admin), buscar o crear usuario por email
        let idUsuarioFinal = id_usuario;
        
        if (!idUsuarioFinal && email) {
            // Buscar usuario por email
            const [usuarioExistente] = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE email = ?',
                [email]
            );
            
            if (usuarioExistente.length > 0) {
                idUsuarioFinal = usuarioExistente[0].id_usuario;
                console.log('✅ Usuario encontrado por email:', email, '- ID:', idUsuarioFinal);
            } else {
                // Crear usuario temporal si no existe
                const passwordTemporal = Math.random().toString(36).slice(-8);
                const [nuevoUsuario] = await pool.query(
                    'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
                    [nombre || 'Cliente', email, passwordTemporal, 'usuario']
                );
                idUsuarioFinal = nuevoUsuario.insertId;
                console.log('✅ Usuario creado temporalmente:', email, '- ID:', idUsuarioFinal);
            }
        }
        
        // Si aún no hay id_usuario, usar el del admin actual
        if (!idUsuarioFinal) {
            idUsuarioFinal = req.usuario?.userId || null;
            console.log('⚠️ Usando ID del admin actual:', idUsuarioFinal);
        }

        const [result] = await pool.query(`INSERT INTO turnos
            (id_usuario, id_cancha, fecha_turno, duracion, precio, estado)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [idUsuarioFinal, id_cancha, fechaMysql, duracion, precio, estado]);

        // Enviar correo de confirmación solo si se proporciona email (sin bloquear la respuesta)
        if (email && email.includes('@')) {
            try {
                await enviarCorreo({
                    destinatario: email,
                    asunto: 'Confirmación de Reserva',
                    contenidoHTML: `
                        <h1>Reserva Confirmada</h1>
                        <p>Hola ${nombre || 'Cliente'},</p>
                        <p>Tu reserva para la cancha ${id_cancha} ha sido confirmada.</p>
                        <ul>
                          <li><strong>Fecha:</strong> ${fechaMysql.split(' ')[0]}</li>
                          <li><strong>Horario:</strong> ${fechaMysql.split(' ')[1]}</li>
                          <li><strong>Precio:</strong> $${precio}</li>
                        </ul>
                        <p>¡Gracias por elegirnos!</p>
                    `,
                });
                console.log('✅ Correo de confirmación enviado a:', email);
            } catch (emailError) {
                console.error('❌ Error enviando correo de confirmación:', emailError);
                // Continuar sin fallar la creación del turno
            }
        } else {
            console.log('ℹ️ No se envió correo de confirmación (email no proporcionado o inválido)');
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

        const [result] = await pool.query(`DELETE FROM turnos WHERE id_turno = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'

            });
        }

        res.json({
            success: true,
            message: 'Turno eliminado exitosamente'
        });
    } catch (error) {
        return manejarErrorServidor(error, 'eliminar turno', res);
    }
});

export default router;