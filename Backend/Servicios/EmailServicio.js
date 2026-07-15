import nodemailer from 'nodemailer';
import { InternalServerError } from '../utils/errors.js';

// Validar configuración de email
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new InternalServerError('Faltan las credenciales de email en las variables de entorno');
}

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER, // Correo electrónico del remitente
        pass: process.env.EMAIL_PASS  // Contraseña de aplicación de Gmail
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Función para enviar correos electrónicos
const enviarCorreo = async ({ destinatario, asunto, contenidoHTML }) => {
    try {
        const opcionesCorreo = {
            from: process.env.EMAIL_USER, // Remitente
            to: destinatario, // Destinatario
            subject: asunto, // Asunto del correo
            html: contenidoHTML // Contenido en formato HTML
        };

        const info = await transporter.sendMail(opcionesCorreo);
        console.log('Correo enviado:', info.messageId);
        return { exito: true, mensaje: 'Correo enviado exitosamente' };
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        return { exito: false, mensaje: 'Error al enviar el correo', error: error.message };
    }
};

export { enviarCorreo };