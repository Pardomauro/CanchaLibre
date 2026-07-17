import express from 'express';
import { pool } from '../config/db.js';
import { protegerRuta } from '../Servicios/token.js';

const router = express.Router();

// Middleware para verificar que sea administrador
const verificarAdmin = (req, res, next) => {
    const userId = req.usuario?.id || req.usuario?.userId;
    
    // Verificar si es admin-token para desarrollo o admin real
    if (typeof userId === 'string' && userId.startsWith('admin-')) {
        next();
    } else {
        // Aquí podrías verificar en la base de datos si el usuario es admin
        // Por ahora, para simplificar, permitimos todos los usuarios autenticados
        next();
    }
};

// GET /api/estadisticas - Obtener todas las estadísticas
router.get('/', [protegerRuta, verificarAdmin], async (req, res) => {
    try {
        // Obtener canchas activas (no en mantenimiento)
        const [canchasActivas] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM canchas 
            WHERE en_mantenimiento = false
        `);

        // Obtener reservas de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const [reservasHoy] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM turnos 
            WHERE DATE(fecha_turno) = ? AND estado = 'reservado'
        `, [hoy]);

        // Obtener total de usuarios registrados
        const [usuariosTotal] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM usuarios
        `);

        // Obtener ingresos del mes actual (completo si 'completado', mitad si 'reservado')
        const [ingresosMes] = await pool.query(`
            SELECT COALESCE(SUM(CASE 
                WHEN estado = 'completado' THEN precio
                WHEN estado = 'reservado' THEN precio / 2
                ELSE 0 END
            ), 0) as total
            FROM turnos
            WHERE YEAR(fecha_turno) = YEAR(CURDATE())
            AND MONTH(fecha_turno) = MONTH(CURDATE())
            AND estado IN ('reservado', 'completado')
        `);

        // Obtener reservas del mes actual
        const [reservasMes] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM turnos 
            WHERE YEAR(fecha_turno) = YEAR(CURDATE()) 
            AND MONTH(fecha_turno) = MONTH(CURDATE())
            AND estado IN ('reservado', 'completado')
        `);

        res.status(200).json({
            success: true,
            message: 'Estadísticas obtenidas correctamente',
            data: {
                canchasActivas: canchasActivas[0].total,
                reservasHoy: reservasHoy[0].total,
                usuariosRegistrados: usuariosTotal[0].total,
                ingresosMes: parseFloat(ingresosMes[0].total) || 0,
                reservasMes: reservasMes[0].total
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener estadísticas',
            error: error.message
        });
    }
});

// GET /api/estadisticas/canchas - Estadísticas específicas de canchas
router.get('/canchas', [protegerRuta, verificarAdmin], async (req, res) => {
    try {
        const [estadisticas] = await pool.query(`
            SELECT 
                COUNT(CASE WHEN en_mantenimiento = false THEN 1 END) as activas,
                COUNT(CASE WHEN en_mantenimiento = true THEN 1 END) as en_mantenimiento,
                COUNT(*) as total
            FROM canchas
        `);

        res.status(200).json({
            success: true,
            message: 'Estadísticas de canchas obtenidas correctamente',
            data: estadisticas[0]
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de canchas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener estadísticas de canchas',
            error: error.message
        }); 
    }
});

// NUEVO
// GET /api/estadisticas/tipo-canchas - Estadísticas de tipo de canchas con más reservas
router.get('/tipo-canchas', [protegerRuta, verificarAdmin], async (req, res) => {
    try {
        const [estadisticas] = await pool.query(`
            SELECT 
                c.tipo_cancha,
                COUNT(t.id_turno) as reservas
            FROM canchas c
            LEFT JOIN turnos t ON c.id = t.id_cancha AND t.estado IN ('completado')
            GROUP BY c.tipo_cancha
            ORDER BY reservas DESC
        `);
        res.status(200).json({
            success: true,
            message: 'Estadísticas de tipo de canchas obtenidas correctamente',
            data: estadisticas
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de tipo de canchas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener estadísticas de tipo de canchas',
            error: error.message
        });
    }
});

// NUEVO
// Estadística de los 5 usuarios que más reservas han hecho, que tengan estado "completado"
router.get('/top-usuarios', [protegerRuta, verificarAdmin], async (req, res) => {
    try { 
        const [estadisticas] = await pool.query(`
            SELECT 
                u.nombre,
                u.email,
                COUNT(t.id_turno) as reservas
            FROM usuarios u
            LEFT JOIN turnos t ON u.id_usuario = t.id_usuario AND t.estado = 'completado'
            GROUP BY u.id_usuario, u.nombre, u.email
            ORDER BY reservas DESC
            LIMIT 5
        `);
        res.status(200).json({
            success: true,
            message: 'Top 5 usuarios con más reservas obtenidas correctamente',
            data: estadisticas
        });
    } catch (error) {
        console.error('Error al obtener top 5 usuarios con más reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener top 5 usuarios con más reservas',
            error: error.message
        });
    }
});

// NUEVO
// Estadística de los horarios más reservados, considerando solo los turnos con estado "completado"
router.get('/horarios-mas-reservados', [protegerRuta, verificarAdmin], async (req, res) => {
    try {
        const [estadisticas] = await pool.query(`
            SELECT
                HOUR(fecha_turno) as hora,
                COUNT(*) as reservas
            FROM turnos
            WHERE estado = 'completado'
            GROUP BY HOUR(fecha_turno)
            ORDER BY reservas DESC
            LIMIT 5
        `);
        res.status(200).json({
            success: true,
            message: 'Horarios más reservados obtenidos correctamente',
            data: estadisticas
        });
    } catch (error) {
        console.error('Error al obtener horarios más reservados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener horarios más reservados',
            error: error.message
        });
    }
});


// GET /api/estadisticas/reservas - Estadísticas específicas de reservas
router.get('/reservas', [protegerRuta, verificarAdmin], async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const [estadisticas] = await pool.query(`
            SELECT 
                COUNT(CASE WHEN DATE(fecha_turno) = ? AND estado = 'reservado' THEN 1 END) as hoy,
                COUNT(CASE WHEN WEEK(fecha_turno) = WEEK(CURDATE()) AND estado = 'reservado' THEN 1 END) as semana,
                COUNT(CASE WHEN MONTH(fecha_turno) = MONTH(CURDATE()) AND estado = 'reservado' THEN 1 END) as mes,
                COUNT(CASE WHEN estado = 'reservado' THEN 1 END) as reservadas,
                COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completadas,
                COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as canceladas,
                COUNT(*) as total
            FROM turnos
        `, [hoy]);

        res.status(200).json({
            success: true,
            message: 'Estadísticas de reservas obtenidas correctamente',
            data: estadisticas[0]
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener estadísticas de reservas',
            error: error.message
        });
    }
});

// GET /api/estadisticas/usuarios - Estadísticas específicas de usuarios
router.get('/usuarios', [protegerRuta, verificarAdmin], async (req, res) => {
    try {
        const [estadisticas] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN rol = 'administrador' THEN 1 END) as administradores,
                COUNT(CASE WHEN rol = 'usuario' THEN 1 END) as usuarios,
                COUNT(CASE WHEN DATE(fecha_creacion) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as nuevos_mes
            FROM usuarios
        `);

        res.status(200).json({
            success: true,
            message: 'Estadísticas de usuarios obtenidas correctamente',
            data: estadisticas[0]
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener estadísticas de usuarios',
            error: error.message
        });
    }
});

// GET /api/estadisticas/ingresos - Estadísticas de ingresos
router.get('/ingresos', [protegerRuta, verificarAdmin], async (req, res) => {
    try {
        const [estadisticas] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN MONTH(fecha_turno) = MONTH(CURDATE()) THEN (
                    CASE WHEN estado = 'completado' THEN precio WHEN estado = 'reservado' THEN precio/2 ELSE 0 END
                ) END), 0) as mes_actual,
                COALESCE(SUM(CASE WHEN MONTH(fecha_turno) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN (
                    CASE WHEN estado = 'completado' THEN precio WHEN estado = 'reservado' THEN precio/2 ELSE 0 END
                ) END), 0) as mes_anterior,
                COALESCE(SUM(CASE WHEN YEAR(fecha_turno) = YEAR(CURDATE()) THEN (
                    CASE WHEN estado = 'completado' THEN precio WHEN estado = 'reservado' THEN precio/2 ELSE 0 END
                ) END), 0) as año_actual,
                COALESCE(SUM(CASE WHEN estado = 'completado' THEN precio WHEN estado = 'reservado' THEN precio/2 ELSE 0 END), 0) as total
            FROM turnos 
            WHERE estado IN ('reservado', 'completado')
        `);

        const mesActual = parseFloat(estadisticas[0].mes_actual) || 0;
        const mesAnterior = parseFloat(estadisticas[0].mes_anterior) || 0;
        const porcentajeCambio = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior * 100) : 0;

        res.status(200).json({
            success: true,
            message: 'Estadísticas de ingresos obtenidas correctamente',
            data: {
                ...estadisticas[0],
                mes_actual: mesActual,
                mes_anterior: mesAnterior,
                año_actual: parseFloat(estadisticas[0].año_actual) || 0,
                total: parseFloat(estadisticas[0].total) || 0,
                porcentaje_cambio_mes: porcentajeCambio.toFixed(2)
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de ingresos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener estadísticas de ingresos',
            error: error.message
        });
    }
});

export default router;