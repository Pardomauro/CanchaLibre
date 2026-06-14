import mysql from 'mysql2/promise';
import 'dotenv/config';

// Configuración de la base de datos

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_turnos_padel',
    charset: 'utf8mb4'
}

// Creamos conexion a la base de datos

const createConnection = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Conexión a la base de datos establecida');
        return connection;
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message);
        throw error;
    }

}


// Creamos pool de conexiones para manejar múltiples conexiones de forma eficiente

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})


// Funcion para incializar la base de datos (crear tablas si no existen)

const inicializarDataBase = async () => {
    try {
        // Crear base de datos si no existe
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await tempConnection.end();

        // Conectar a la base de datos y crear tabla
        const connection = await createConnection();

        // Crear tabla canchas
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS canchas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                precio DECIMAL(10, 2) NOT NULL,
                en_mantenimiento BOOLEAN NOT NULL DEFAULT false,
                horarios_disponibles JSON NOT NULL,
                tipo_cancha ENUM('Futbol', 'Padel', 'Tenis', 'Otra') NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);


        // Crear tabla usuarios con columna rol
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(191) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                rol ENUM('usuario', 'administrador') NOT NULL DEFAULT 'usuario',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Asegurarse de que la columna rol exista en caso de que la tabla ya esté creada
        try {
            await connection.execute(`
                ALTER TABLE usuarios 
                ADD COLUMN rol ENUM('usuario', 'administrador') NOT NULL DEFAULT 'usuario';
            `);
        } catch (error) {
            // Si la columna ya existe, ignorar el error
        }

        // Agregar columna celular para mantener compatibilidad con las rutas actuales
        try {
            await connection.execute(`
                ALTER TABLE usuarios 
                ADD COLUMN celular VARCHAR(20) DEFAULT NULL;
            `);
        } catch (error) {
            // Si la columna ya existe, ignorar el error
            if (error.code !== 'ER_DUP_FIELDNAME') {
                throw error;
            }
        }

        // Agregar columnas para código de verificación
        try {
            await connection.execute(`
                ALTER TABLE usuarios 
                ADD COLUMN codigo_verificacion VARCHAR(6) DEFAULT NULL,
                ADD COLUMN codigo_expiracion TIMESTAMP DEFAULT NULL;
            `);
        } catch (error) {
            // Si las columnas ya existen, ignorar el error
            if (error.code !== 'ER_DUP_FIELDNAME') {
                throw error;
            }
        }

        // Crear tabla turnos
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS turnos (
                id_turno INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                id_cancha INT NOT NULL,
                fecha_turno DATETIME NOT NULL,
                duracion INT NOT NULL, 
                precio DECIMAL(10, 2) NOT NULL,
                tipo_cancha ENUM('Futbol', 'Padel', 'Tenis', 'Otra') NOT NULL,
                estado ENUM('pendiente de pago', 'reservado', 'cancelado', 'completado') NOT NULL DEFAULT 'reservado',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_cancha) REFERENCES canchas(id) ON DELETE CASCADE
            )
        `);

        // Asegurar que la columna tipo_cancha exista en turnos
        try {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN tipo_cancha ENUM('Futbol', 'Padel', 'Tenis', 'Otra') NOT NULL DEFAULT 'Padel';
            `);
        } catch (error) {
            // Si la columna ya existe, ignorar el error
            if (error.code !== 'ER_DUP_FIELDNAME') {
                throw error;
            }
        }

        // Asegurar que la columna estado de turnos soporte el nuevo estado pendiente
        try {
            await connection.execute(`
                ALTER TABLE turnos 
                MODIFY COLUMN estado ENUM('pendiente de pago', 'reservado', 'cancelado', 'completado') NOT NULL DEFAULT 'reservado';
            `);
        } catch (error) {
            // Si la modificación falla por cualquier motivo distinto al esquema ya actualizado, propagarlo
            if (!String(error.message || '').includes('Data truncated') && error.code !== 'ER_DUP_FIELDNAME') {
                throw error;
            }
        }


        console.log('Tablas "canchas", "usuarios" y "turnos" creadas o ya existentes');

        // Insertar datos de prueba si no existen canchas
        const [canchas] = await connection.execute('SELECT COUNT(*) as count FROM canchas');
        if (canchas[0].count === 0) {
            console.log('Insertando canchas de prueba...');

            // Canchas de prueba con horarios disponibles
            const canchasPrueba = [
                {
                    precio: 25000,
                    en_mantenimiento: false,
                    horarios: JSON.stringify([
                        "08:00-09:30", "09:30-11:00", "11:00-12:30",
                        "12:30-14:00", "14:00-15:30", "15:30-17:00",
                        "17:00-18:30", "18:30-20:00", "20:00-21:30", "21:30-23:00"
                    ])
                },
                {
                    precio: 28000,
                    en_mantenimiento: false,
                    horarios: JSON.stringify([
                        "08:00-09:30", "09:30-11:00", "11:00-12:30",
                        "12:30-14:00", "14:00-15:30", "15:30-17:00",
                        "17:00-18:30", "18:30-20:00", "20:00-21:30", "21:30-23:00"
                    ])
                },
                {
                    precio: 30000,
                    en_mantenimiento: true,
                    horarios: JSON.stringify([
                        "08:00-09:30", "09:30-11:00", "11:00-12:30",
                        "12:30-14:00", "14:00-15:30", "15:30-17:00",
                        "17:00-18:30", "18:30-20:00", "20:00-21:30", "21:30-23:00"
                    ])
                },
                {
                    precio: 26000,
                    en_mantenimiento: false,
                    horarios: JSON.stringify([
                        "08:00-09:30", "09:30-11:00", "11:00-12:30",
                        "12:30-14:00", "14:00-15:30", "15:30-17:00",
                        "17:00-18:30", "18:30-20:00", "20:00-21:30", "21:30-23:00"
                    ])
                }
            ];

            for (const cancha of canchasPrueba) {
                await connection.execute(
                    'INSERT INTO canchas (precio, en_mantenimiento, horarios_disponibles, tipo_cancha) VALUES (?, ?, ?, ?)',
                    [cancha.precio, cancha.en_mantenimiento, cancha.horarios, 'Padel']
                );
            }

            console.log('Canchas de prueba insertadas correctamente');
        }

        // Insertar usuario administrador por defecto si no existe
        const adminEmail = process.env.ADMIN_EMAIL || 'sistematurnos2025@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Sistematurnos2025.@';
        const adminName = process.env.ADMIN_NAME || 'AdministradorSistema';

        const [usuarios] = await connection.execute('SELECT COUNT(*) as count FROM usuarios WHERE email = ?', [adminEmail]);
        if (usuarios[0].count === 0) {
            console.log('Creando usuario administrador por defecto...');
            const bcrypt = await import('bcrypt');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await connection.execute(
                'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
                [adminName, adminEmail, hashedPassword, 'administrador']
            );

            console.log(`Usuario administrador creado: ${adminEmail}`);
        } else {
            console.log(`Usuario administrador ya existe: ${adminEmail}`);
        }

        await connection.end();
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error.message);
        throw error;
    }
}

export {
    createConnection,
    pool,
    inicializarDataBase
};
