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
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER, // Correo electrónico del remitente
        pass: process.env.EMAIL_PASS  // Contraseña de aplicación de Gmail
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    connectionTimeout: 30000, // 30 segundos (aumentado)
    greetingTimeout: 30000,   // 30 segundos (aumentado)
    socketTimeout: 30000,     // 30 segundos (aumentado)
    pool: true,               // Usar pool de conexiones
    maxConnections: 5,        // Máximo 5 conexiones simultáneas
    maxMessages: 100          // Máximo 100 mensajes por conexión
});

// Función para verificar la conexión del transportador
const verificarConexion = async () => {
    try {
        await transporter.verify();
        console.log('✅ Servicio de email configurado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error en la configuración del servicio de email:', error.message);
        console.error('Detalles:', {
            code: error.code,
            command: error.command,
            response: error.response
        });
        return false;
    }
};

// Función para enviar correos electrónicos con reintentos
const enviarCorreo = async ({ destinatario, asunto, contenidoHTML }, intentos = 3) => {
    for (let i = 0; i < intentos; i++) {
        try {
            const opcionesCorreo = {
                from: `"Sistema Turnos Padel" <${process.env.EMAIL_USER}>`, // Remitente con nombre
                to: destinatario, // Destinatario
                subject: asunto, // Asunto del correo
                html: contenidoHTML // Contenido en formato HTML
            };

            const info = await transporter.sendMail(opcionesCorreo);
            console.log(`✅ Correo enviado (intento ${i + 1}/${intentos}):`, info.messageId);
            return { exito: true, mensaje: 'Correo enviado exitosamente', messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Error al enviar correo (intento ${i + 1}/${intentos}):`, error.message);
            
            // Si es el último intento, devolver error
            if (i === intentos - 1) {
                // Proveer mensajes de error más específicos
                let mensajeError = 'Error al enviar el correo';
                
                if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
                    mensajeError = 'Timeout de conexión. Verifica tu conexión a internet y la configuración de Gmail.';
                } else if (error.code === 'EAUTH') {
                    mensajeError = 'Error de autenticación. Verifica EMAIL_USER y EMAIL_PASS en el archivo .env';
                } else if (error.code === 'ESOCKET') {
                    mensajeError = 'Error de socket. El servidor SMTP puede estar inaccesible.';
                }
                
                return { 
                    exito: false, 
                    mensaje: mensajeError, 
                    error: error.message,
                    code: error.code,
                    detalles: 'Revisa: 1) Contraseña de aplicación de Gmail, 2) Autenticación de 2 pasos habilitada, 3) Conexión a internet'
                };
            }
            
            // Esperar 2 segundos antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// Verificar la conexión al iniciar el servicio
verificarConexion().catch(err => {
    console.warn('⚠️  El servicio de email no está disponible. Los correos no se enviarán.');
});

export { enviarCorreo, verificarConexion };