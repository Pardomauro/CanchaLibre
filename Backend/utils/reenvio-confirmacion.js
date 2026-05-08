// Script para reenviar correo de confirmación de un turno por id
import 'dotenv/config';
import { pool } from '../Config/db.js';
import { enviarCorreo } from '../Servicios/EmailServicio.js';

const id = process.argv[2];

if (!id) {
    console.error('Uso: node -r dotenv/config utils/reenvio-confirmacion.js <id_turno>');
    process.exit(1);
}

const main = async () => {
    try {
        const [rows] = await pool.query(
            `SELECT t.id_turno, t.id_cancha, t.fecha_turno, t.duracion, t.precio, t.estado, u.email as email_usuario, u.nombre as nombre_usuario
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

        const fecha = new Date(turno.fecha_turno).toLocaleString();

        const res = await enviarCorreo({
            destinatario: turno.email_usuario,
            asunto: 'Confirmación de Reserva (reenviado)',
            contenidoHTML: `
                <h1>Reserva Confirmada</h1>
                <p>Hola ${turno.nombre_usuario || 'Cliente'},</p>
                <p>Tu reserva para la cancha ${turno.id_cancha} ha sido confirmada.</p>
                <ul>
                  <li><strong>Fecha:</strong> ${fecha.split(',')[0]}</li>
                  <li><strong>Horario:</strong> ${fecha.split(',')[1] || ''}</li>
                  <li><strong>Precio:</strong> $${turno.precio}</li>
                </ul>
                <p>¡Gracias por elegirnos!</p>
            `
        });

        console.log('Resultado reenvío:', res);
    } catch (err) {
        console.error('Error reenviando confirmación:', err.message || err);
    } finally {
        process.exit(0);
    }
};

main();
