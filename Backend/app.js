import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { inicializarDataBase } from './config/db.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de rate limiting según el entorno
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 100 : 500, // 500 en desarrollo, 100 en producción
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true, // Devolver info del rate limit en headers `RateLimit-*`
    legacyHeaders: false, // Deshabilitar headers `X-RateLimit-*`
});

// Middleware
app.use(helmet()); // Seguridad HTTP
app.use(morgan('dev')); // Logging de solicitudes
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter); // Aplicar rate limiting a todas las rutas

// Rutas
import rutasTurnos from './rutas/Turnos.js';
import rutasUsuario from './rutas/Usuario.js';
import rutasCanchas from './rutas/Canchas.js';
import rutasEstadisticas from './rutas/Estadisticas.js';

app.use('/api/turnos', rutasTurnos);
app.use('/api/usuarios', rutasUsuario);
app.use('/api/canchas', rutasCanchas);
app.use('/api/estadisticas', rutasEstadisticas);

// Importar manejadores de errores
import { NotFoundError, globalErrorHandler } from './utils/errors.js';

// Middleware para manejar errores 404 (ruta no encontrada)
app.use((req, res, next) => {
    next(new NotFoundError(`No se encontró la ruta ${req.originalUrl} en este servidor`));
});

// Manejo global de errores
app.use(globalErrorHandler);

// Inicializar la base de datos y luego iniciar el servidor
const iniciarServidor = async () => {
    try {
        await inicializarDataBase();
        app.listen(PORT, () => {
            console.log(`Servidor en ejecución en el puerto ${PORT}`);
            console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

iniciarServidor().catch(error => {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
});

export { app, iniciarServidor };