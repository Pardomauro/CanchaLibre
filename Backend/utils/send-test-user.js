// Script temporal para enviar un correo de prueba a una dirección dada
import { enviarCorreo } from '../Servicios/EmailServicio.js';
import 'dotenv/config';

const email = process.argv[2];

if (!email) {
    console.error('Uso: node -r dotenv/config utils/send-test-user.js correo@ejemplo.com');
    process.exit(1);
}

const main = async () => {
    console.log('Enviando prueba a:', email);
    try {
        const res = await enviarCorreo({
            destinatario: email,
            asunto: 'Prueba de correo de confirmación - Sistema Turnos Pádel',
            contenidoHTML: `<p>Este es un correo de prueba enviado a <strong>${email}</strong> para verificar la entrega.</p>`
        });

        console.log('Resultado:', res);
    } catch (err) {
        console.error('Error enviando correo de prueba:', err.message || err);
    }
};

main();
