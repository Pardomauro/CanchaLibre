
import express from 'express';
import { validationResult } from 'express-validator';
import { pool } from '../Config/db.js';
import {
    validarCampos,
    manejarErrorServidor,
    validacionesCrearCancha,
    validacionesActualizarCancha,
    validacionesObtenerCancha,
    validacionesEliminarCancha,
    validacionesDisponibilidad
} from '../middlewares/index.js';
import { parsearHorarios, validarCamposActualizacion } from '../middlewares/helpers.js';

const router = express.Router();

// GET /api/canchas - Obtener todas las canchas
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id as id_cancha,
                precio,
                en_mantenimiento,
                horarios_disponibles,
                fecha_creacion,
                fecha_actualizacion
            FROM canchas 
            ORDER BY id ASC
        `);

        // Procesar los horarios_disponibles para que sean arrays
        const processedRows = rows.map(row => ({
            ...row,
            horarios_disponibles: parsearHorarios(row.horarios_disponibles)
        }));

        res.status(200).json({
            success: true,
            message: 'Canchas obtenidas correctamente',
            data: processedRows,
            total: processedRows.length
        });
    } catch (error) {
        return manejarErrorServidor(error, 'obtener canchas', res);
    }
});

// GET /api/canchas/:id - Obtener una cancha específica por ID
router.get('/:id', [
    ...validacionesObtenerCancha,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                id as id_cancha,
                precio,
                en_mantenimiento,
                horarios_disponibles,
                fecha_creacion,
                fecha_actualizacion
            FROM canchas 
            WHERE id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        // Procesar horarios_disponibles
        const processedCancha = {
            ...rows[0],
            horarios_disponibles: parsearHorarios(rows[0].horarios_disponibles)
        };

        res.status(200).json({
            success: true,
            message: 'Cancha obtenida correctamente',
            data: processedCancha
        });
    } catch (error) {
        return manejarErrorServidor(error, 'obtener cancha específica', res);
    }
});

// GET /api/canchas/disponibles - Obtener solo canchas disponibles (no en mantenimiento)
router.get('/disponibles', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id as id_cancha,
                precio,
                en_mantenimiento,
                horarios_disponibles,
                fecha_creacion,
                fecha_actualizacion
            FROM canchas 
            WHERE en_mantenimiento = false
            ORDER BY id ASC
        `);

        // Procesar los horarios_disponibles para que sean arrays
        const processedRows = rows.map(row => ({
            ...row,
            horarios_disponibles: parsearHorarios(row.horarios_disponibles)
        }));

        res.status(200).json({
            success: true,
            message: 'Canchas disponibles obtenidas correctamente',
            data: processedRows,
            total: processedRows.length
        });
    } catch (error) {
        console.error('Error al obtener las canchas disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener las canchas disponibles',
            error: error.message
        });
    }
});

// Ruta para verificar disponibilidad de canchas
router.post('/turnos/disponibilidad', [
    ...validacionesDisponibilidad,
    validarCampos
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }

    const { fecha, horaInicio, horaFin, id_cancha } = req.body;

    try {
        const [resultados] = await pool.query(
            `SELECT * FROM turnos WHERE id_cancha = ? AND fecha_turno BETWEEN ? AND ?`,
            [id_cancha, `${fecha} ${horaInicio}`, `${fecha} ${horaFin}`]
        );

        if (resultados.length > 0) {
            return res.status(200).json({ disponible: false, mensaje: 'La cancha no está disponible en el horario solicitado.' });
        }

        res.status(200).json({ disponible: true, mensaje: 'La cancha está disponible.' });
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({ error: 'Error interno al verificar disponibilidad.' });
    }
});


// POST /api/canchas - Crear una nueva cancha
router.post('/', [
    ...validacionesCrearCancha,
    validarCampos
], async (req, res) => {
    try {
        const { precio, en_mantenimiento = false, horarios_disponibles } = req.body;

        // Validaciones básicas
        if (!precio || isNaN(precio) || precio <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un número mayor a 0'
            });
        }

        if (typeof en_mantenimiento !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'El estado de mantenimiento debe ser true o false'
            });
        }

        if (!horarios_disponibles || !Array.isArray(horarios_disponibles) || horarios_disponibles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un horario disponible'
            });
        }

        // Crear la nueva cancha en la base de datos
        const [result] = await pool.query(`
            INSERT INTO canchas (precio, en_mantenimiento, horarios_disponibles, fecha_creacion, fecha_actualizacion)
            VALUES (?, ?, ?, NOW(), NOW())
        `, [precio, en_mantenimiento, JSON.stringify(horarios_disponibles)]);

        // Obtener la cancha recién creada con todos sus campos
        const [newCancha] = await pool.query(`
            SELECT 
                id as id_cancha,
                precio,
                en_mantenimiento,
                horarios_disponibles,
                fecha_creacion,
                fecha_actualizacion
            FROM canchas 
            WHERE id = ?
        `, [result.insertId]);

        // Parsear los horarios para la respuesta
        const canchaCreada = {
            ...newCancha[0],
            horarios_disponibles: parsearHorarios(newCancha[0].horarios_disponibles)
        };

        res.status(201).json({
            success: true,
            message: 'Cancha creada correctamente',
            data: canchaCreada
        });
    } catch (error) {
        return manejarErrorServidor(error, 'crear cancha', res);
    }
});



// PUT /api/canchas/:id - Actualizar una cancha existente
router.put('/:id', [
    ...validacionesActualizarCancha,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🔧 Actualizando cancha:', { id, body: req.body });

        // Verificar que la cancha exista
        const [canchas] = await pool.query('SELECT * FROM canchas WHERE id = ?', [id]);
        if (canchas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        const { precio, en_mantenimiento, horarios_disponibles } = req.body;
        const canchaActual = canchas[0];

        console.log('📋 Datos recibidos:', {
            precio: { valor: precio, tipo: typeof precio },
            en_mantenimiento: { valor: en_mantenimiento, tipo: typeof en_mantenimiento },
            horarios_disponibles: { valor: horarios_disponibles, tipo: typeof horarios_disponibles, esArray: Array.isArray(horarios_disponibles) }
        });

        // Validar que al menos un campo sea enviado para actualizar
        const camposPermitidos = ['precio', 'en_mantenimiento', 'horarios_disponibles'];
        if (!validarCamposActualizacion(req.body, camposPermitidos)) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar',
                camposPermitidos,
                camposRecibidos: Object.keys(req.body)
            });
        }

        // Validaciones básicas con más detalles
        if (precio !== undefined) {
            if (isNaN(precio) || precio <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio debe ser un número mayor a 0',
                    valorRecibido: precio,
                    tipoRecibido: typeof precio
                });
            }
        }

        if (en_mantenimiento !== undefined) {
            // Convertir diferentes representaciones a boolean
            let booleanValue;
            if (typeof en_mantenimiento === 'boolean') {
                booleanValue = en_mantenimiento;
            } else if (typeof en_mantenimiento === 'string') {
                booleanValue = en_mantenimiento.toLowerCase() === 'true';
            } else if (typeof en_mantenimiento === 'number') {
                booleanValue = en_mantenimiento === 1;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'El estado de mantenimiento debe ser boolean, "true"/"false", 1/0',
                    valorRecibido: en_mantenimiento,
                    tipoRecibido: typeof en_mantenimiento
                });
            }

            console.log('🔄 Conversión de en_mantenimiento:', {
                original: en_mantenimiento,
                convertido: booleanValue,
                tipoOriginal: typeof en_mantenimiento,
                tipoConvertido: typeof booleanValue
            });
        }

        if (horarios_disponibles !== undefined) {
            if (!Array.isArray(horarios_disponibles)) {
                return res.status(400).json({
                    success: false,
                    message: 'Los horarios disponibles deben ser un array',
                    valorRecibido: horarios_disponibles,
                    tipoRecibido: typeof horarios_disponibles
                });
            }

            if (horarios_disponibles.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar al menos un horario disponible',
                    valorRecibido: horarios_disponibles
                });
            }

            // Validar que los horarios no estén vacíos
            const horariosVacios = horarios_disponibles.filter(h => !h || h.trim() === '');
            if (horariosVacios.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Los horarios no pueden estar vacíos',
                    horariosVacios: horariosVacios.length,
                    totalHorarios: horarios_disponibles.length
                });
            }
        }

        // Preparar valores para actualizar (usar valores actuales si no se proporcionan nuevos)
        const precioFinal = precio !== undefined ? precio : canchaActual.precio;
        const mantenimientoFinal = en_mantenimiento !== undefined ?
            (typeof en_mantenimiento === 'boolean' ? en_mantenimiento :
                typeof en_mantenimiento === 'string' ? en_mantenimiento.toLowerCase() === 'true' :
                    typeof en_mantenimiento === 'number' ? en_mantenimiento === 1 : false)
            : canchaActual.en_mantenimiento;
        const horariosFinal = horarios_disponibles !== undefined ? JSON.stringify(horarios_disponibles) : canchaActual.horarios_disponibles;

        console.log('💾 Guardando valores finales:', {
            precioFinal,
            mantenimientoFinal,
            horariosFinal: typeof horariosFinal === 'string' ? JSON.parse(horariosFinal) : horariosFinal
        });

        // Actualizar cancha en la base de datos
        await pool.query(
            'UPDATE canchas SET precio = ?, en_mantenimiento = ?, horarios_disponibles = ?, fecha_actualizacion = NOW() WHERE id = ?',
            [precioFinal, mantenimientoFinal, horariosFinal, id]
        );

        // Obtener cancha actualizada con formato consistente
        const [canchaActualizada] = await pool.query(`
            SELECT 
                id as id_cancha,
                precio,
                en_mantenimiento,
                horarios_disponibles,
                fecha_creacion,
                fecha_actualizacion
            FROM canchas 
            WHERE id = ?
        `, [id]);

        // Parsear los horarios para la respuesta
        const canchaResponse = {
            ...canchaActualizada[0],
            horarios_disponibles: parsearHorarios(canchaActualizada[0].horarios_disponibles)
        };

        res.status(200).json({
            success: true,
            message: `Actualización de cancha ${id} realizada correctamente`,
            data: canchaResponse
        });
    } catch (error) {
        return manejarErrorServidor(error, 'actualizar cancha', res);
    }
});

// DELETE /api/canchas/:id - Eliminar una cancha
router.delete('/:id', [
    ...validacionesEliminarCancha,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la cancha exista y obtener sus datos antes de eliminar
        const [canchas] = await pool.query('SELECT * FROM canchas WHERE id = ?', [id]);
        if (canchas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        const canchaEliminada = canchas[0];

        // Eliminar la cancha de la base de datos
        const [result] = await pool.execute(
            'DELETE FROM canchas WHERE id = ?',
            [id]
        );

        // Verificar que la eliminación fue exitosa
        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo eliminar la cancha'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cancha eliminada correctamente',
            data: {
                id_cancha: canchaEliminada.id,
                eliminada_en: new Date().toISOString()
            }
        });
    } catch (error) {
        return manejarErrorServidor(error, 'eliminar cancha', res);
    }
});

export default router;
