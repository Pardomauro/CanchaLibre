// Script para probar la configuración de email
import 'dotenv/config';
import { enviarCorreo } from '../Servicios/EmailServicio.js';

const probarEmail = async () => {
    console.log('🔍 Probando configuración de email...');
    console.log('📧 Usuario:', process.env.EMAIL_USER);
    console.log('🔑 Contraseña configurada:', process.env.EMAIL_PASS ? 'SÍ' : 'NO');
    
    try {
        const resultado = await enviarCorreo({
            destinatario: process.env.EMAIL_USER, // Enviar a ti mismo como prueba
            asunto: '✅ Prueba de Configuración - Sistema Turnos Pádel',
            contenidoHTML: `
                <h1>🎉 ¡Configuración exitosa!</h1>
                <p>Si recibes este correo, la configuración de email está funcionando correctamente.</p>
                <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <h3>📋 Detalles de la configuración:</h3>
                    <ul>
                        <li><strong>Email:</strong> ${process.env.EMAIL_USER}</li>
                        <li><strong>Servicio:</strong> ${process.env.EMAIL_SERVICE}</li>
                        <li><strong>Host:</strong> ${process.env.EMAIL_HOST}</li>
                        <li><strong>Puerto:</strong> ${process.env.EMAIL_PORT}</li>
                        <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
                    </ul>
                </div>
                <p>✅ El sistema está listo para enviar correos de recuperación de contraseña y confirmaciones de reserva.</p>
            `
        });

        if (resultado.exito) {
            console.log('✅ ¡Email enviado exitosamente!');
            console.log('📨 Revisa tu bandeja de entrada:', process.env.EMAIL_USER);
        } else {
            console.log('❌ Error al enviar email:', resultado.mensaje);
        }
    } catch (error) {
        console.error('💥 Error en la prueba:', error.message);
    }
};

// Ejecutar la prueba
probarEmail();