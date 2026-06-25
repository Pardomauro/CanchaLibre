// Utilidad para enviar correos de cancelación de reserva
import 'dotenv/config';
import { pool } from '../config/db.js';
import { enviarCorreo } from '../servicios/EmailServicio.js';
import { formatearFechaReserva } from './reenvio-confirmacion.js';

/**
 * Envía un correo de cancelación de reserva
 * @param {Object} params - Parámetros del correo
 * @param {string} params.email - Email del destinatario
 * @param {string} params.nombre - Nombre del usuario
 * @param {number} params.id_cancha - ID de la cancha
 * @param {Date|string} params.fechaMysql - Fecha de la reserva
 * @param {number} params.precio - Precio de la reserva
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export const enviarCorreoCancelacionReserva = async ({ email, nombre, id_cancha, fechaMysql, precio }) => {
    if (!email || !email.includes('@')) {
        console.warn('Email inválido, no se puede enviar correo');
        return false;
    }

    const { fechaTexto, horaTexto } = formatearFechaReserva(fechaMysql);

    try {
        await enviarCorreo({
            destinatario: email,
            asunto: 'Cancelación de Reserva',
            contenidoHTML: `
                <h1>Reserva Cancelada</h1>
                <p>Hola ${nombre || 'Cliente'},</p>
                <p>Tu reserva para la cancha ${id_cancha} ha sido cancelada.</p>
                <ul>
                    <li><strong>Fecha:</strong> ${fechaTexto}</li>
                    <li><strong>Horario:</strong> ${horaTexto}</li>
                    <li><strong>Precio:</strong> $${precio}</li>
                </ul>
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                <a href="https://wa.me/+5493515606326" target="_blank" style="display:inline-block;padding:10px 20px;margin-top:10px;background-color:#25D366;color:white;text-decoration:none;border-radius:5px;">Contactar por WhatsApp</a>
            `
        });
        return true;
    } catch (error) {
        console.error('Error al enviar correo de cancelación:', error);
        return false;
    }
};

// Script de CLI para enviar correo de cancelación por ID de turno
const main = async () => {
    const id = process.argv[2];

    if (!id) {
        console.error('Uso: node utils/envio-cancelacion.js <id_turno>');
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

        const enviado = await enviarCorreoCancelacionReserva({
            email: turno.email_usuario,
            nombre: turno.nombre_usuario,
            id_cancha: turno.id_cancha,
            fechaMysql: turno.fecha_turno,
            precio: turno.precio
        });

        if (enviado) {
            console.log('✅ Correo de cancelación enviado exitosamente');
        } else {
            console.error('❌ Error al enviar correo de cancelación');
            process.exit(1);
        }
    } catch (err) {
        console.error('Error enviando cancelación:', err.message || err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

// Solo ejecutar el script si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}