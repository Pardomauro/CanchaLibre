// Utilidad para enviar correos de confirmación de reserva
import 'dotenv/config';
import { pool } from '../config/db.js';
import { enviarCorreo } from '../servicios/EmailServicio.js';

/**
 * Formatea una fecha para mostrar en el correo
 */
export const formatearFechaReserva = (fechaEntrada) => {
    if (!fechaEntrada) {
        return { fechaTexto: 'Sin fecha', horaTexto: '' };
    }

    const fecha = fechaEntrada instanceof Date ? fechaEntrada : new Date(fechaEntrada);

    if (Number.isNaN(fecha.getTime())) {
        const fechaTexto = String(fechaEntrada);
        const [fechaParte = fechaTexto, horaParte = ''] = fechaTexto.split(' ');
        return { fechaTexto: fechaParte, horaTexto: horaParte };
    }

    return {
        fechaTexto: fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        horaTexto: fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        })
    };
};

/**
 * Envía un correo de confirmación de reserva
 * @param {Object} params - Parámetros del correo
 * @param {string} params.email - Email del destinatario
 * @param {string} params.nombre - Nombre del usuario
 * @param {number} params.id_cancha - ID de la cancha
 * @param {Date|string} params.fechaMysql - Fecha de la reserva
 * @param {number} params.precio - Precio de la reserva
 * @param {boolean} params.esReenvio - Si es un reenvío (opcional)
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export const enviarCorreoConfirmacionReserva = async ({ email, nombre, id_cancha, fechaMysql, precio, esReenvio = false }) => {
    if (!email || !email.includes('@')) {
        console.warn('Email inválido, no se puede enviar correo');
        return false;
    }

    const { fechaTexto, horaTexto } = formatearFechaReserva(fechaMysql);
    const asunto = esReenvio ? 'Confirmación de Reserva (reenviado)' : 'Confirmación de Reserva';

    try {
        await enviarCorreo({
            destinatario: email,
            asunto: asunto,
            contenidoHTML: `
                <h1>Reserva Confirmada</h1>
                <p>Hola ${nombre || 'Cliente'},</p>
                <p>Tu reserva para la cancha ${id_cancha} ha sido confirmada.</p>
                <ul>
                    <li><strong>Fecha:</strong> ${fechaTexto}</li>
                    <li><strong>Horario:</strong> ${horaTexto}</li>
                    <li><strong>Precio:</strong> $${precio}</li>
                </ul>
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                <a href="https://wa.me/+5493515606326" target="_blank" style="display:inline-block;padding:10px 20px;margin-top:10px;background-color:#25D366;color:white;text-decoration:none;border-radius:5px;">Contactar por WhatsApp</a>
                <p>¡Gracias por elegirnos!</p>
            `
        });
        return true;
    } catch (error) {
        console.error('Error al enviar correo de confirmación:', error);
        return false;
    }
};

// Script de CLI para reenviar correo por ID de turno
const main = async () => {
    const id = process.argv[2];

    if (!id) {
        console.error('Uso: node utils/reenvio-confirmacion.js <id_turno>');
        process.exit(1);
    }

    try {
        const [rows] = await pool.query(
            `SELECT t.id_turno, t.id_cancha, t.fecha_turno, t.duracion, t.precio, t.estado, 
                    u.email as email_usuario, u.nombre as nombre_usuario
             FROM turnos t
             LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
             WHERE t.id_turno = ?`,
            [id]
        );

        if (!rows || rows.length === 0) {
            console.error('No se encontró el turno id:', id);
            process.exit(1);
        }

        const turno = rows[0];
        if (!turno.email_usuario) {
            console.error('El turno no tiene email asociado');
            process.exit(1);
        }

        const enviado = await enviarCorreoConfirmacionReserva({
            email: turno.email_usuario,
            nombre: turno.nombre_usuario,
            id_cancha: turno.id_cancha,
            fechaMysql: turno.fecha_turno,
            precio: turno.precio,
            esReenvio: true
        });

        if (enviado) {
            console.log('✅ Correo de confirmación reenviado exitosamente');
        } else {
            console.error('❌ Error al reenviar correo de confirmación');
            process.exit(1);
        }
    } catch (err) {
        console.error('Error reenviando confirmación:', err.message || err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

// Solo ejecutar el script si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
