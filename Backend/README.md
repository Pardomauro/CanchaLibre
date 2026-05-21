# 🚀 Backend - Sistema Turnos Pádel

## 📋 Configuración Inicial

### 1. Instalación
```bash
cd Backend
npm install
```

### 2. Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Configurar tus credenciales locales
# IMPORTANTE: Nunca subir .env al repositorio
```

### 3. Base de Datos MySQL

#### Crear Base de Datos
```sql
CREATE DATABASE sistema_turnos_padel;
USE sistema_turnos_padel;
```

#### Estructura de Tablas
```sql
-- Tabla usuarios
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla canchas
CREATE TABLE canchas (
    id_cancha INT PRIMARY KEY AUTO_INCREMENT,
    precio DECIMAL(10,2) NOT NULL,
    en_mantenimiento BOOLEAN DEFAULT FALSE,
    horarios_disponibles JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla turnos
CREATE TABLE turnos (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT, -- NULL permitido para reservas administrativas
    id_cancha INT NOT NULL,
    fecha_turno DATETIME NOT NULL,
    duracion INT NOT NULL COMMENT 'Duración en minutos',
    precio DECIMAL(10,2) NOT NULL,
    estado ENUM('reservado', 'cancelado', 'completado') DEFAULT 'reservado',
    nombre VARCHAR(100), -- Para reservas sin usuario registrado
    email VARCHAR(100), -- Para reservas sin usuario registrado
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (id_cancha) REFERENCES canchas(id_cancha) ON DELETE CASCADE
);
```

### 4. Configurar Email (Gmail)
1. Activar verificación en 2 pasos
2. Generar contraseña de aplicación: [Google Account Settings](https://myaccount.google.com/security)
3. Usar esa contraseña en `EMAIL_PASS`

### 5. Ejecutar el Servidor
```bash
npm start              # Producción
npm run dev           # Desarrollo con nodemon
npm run test:email    # Test de configuración email
```

### 6. Verificación
- Servidor: http://localhost:3000
- API Base: http://localhost:3000/api

## 🔧 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `tu_password` |
| `DB_NAME` | Nombre de la base de datos | `sistema_turnos_padel` |
| `JWT_SECRET` | Clave secreta para JWT | `clave_super_secreta_123` |
| `EMAIL_USER` | Usuario de Gmail | `tu_email@gmail.com` |
| `EMAIL_PASS` | Contraseña de aplicación Gmail | `abcd efgh ijkl mnop` |

## 📡 API Endpoints

### **Autenticación**
- `POST /api/usuarios/login` - Iniciar sesión
- `POST /api/usuarios/registrar` - Registrar usuario
- `POST /api/usuarios/recuperar-contrasena` - Recuperar contraseña
- `POST /api/usuarios/verificar-codigo` - Verificar código de recuperación

### **Usuarios**
- `GET /api/usuarios` - Obtener todos los usuarios (Admin)
- `GET /api/usuarios/:id` - Obtener usuario específico
- `POST /api/usuarios` - Crear usuario (Admin)
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario (Admin)

### **Canchas**
- `GET /api/canchas` - Listar todas las canchas
- `GET /api/canchas/:id` - Obtener cancha específica
- `GET /api/canchas/disponibles` - Obtener solo canchas disponibles (no en mantenimiento)
- `POST /api/canchas` - Crear cancha (Admin)
- `POST /api/canchas/turnos/disponibilidad` - Verificar disponibilidad de cancha
- `PUT /api/canchas/:id` - Editar cancha (Admin)
- `DELETE /api/canchas/:id` - Eliminar cancha (Admin)

### **Turnos/Reservas**
- `GET /api/turnos` - Obtener todas las reservas (Admin)
- `GET /api/turnos/usuario/:id` - Reservas de un usuario
- `GET /api/turnos/:id` - Obtener reserva específica
- `GET /api/turnos/disponibilidad/:id_cancha/:fecha/:hora` - Verificar disponibilidad
- `GET /api/turnos/horarios-disponibles/:id_cancha/:fecha/:duracion` - Horarios disponibles con duración específica
- `GET /api/turnos/horarios-disponibles/:id_cancha/:fecha` - Horarios disponibles (60 min por defecto)
- `GET /api/turnos/fecha/:fecha` - Reservas por fecha
- `POST /api/turnos` - Crear reserva
- `POST /api/turnos/:id/confirmar` - Confirmar reserva pendiente (Admin)
- `PUT /api/turnos/:id` - Actualizar reserva
- `DELETE /api/turnos/:id` - Eliminar reserva (Admin)

### **Estadísticas (Admin)**
- `GET /api/estadisticas` - Estadísticas generales del sistema
- `GET /api/estadisticas/canchas` - Estadísticas de canchas
- `GET /api/estadisticas/reservas` - Estadísticas de reservas
- `GET /api/estadisticas/usuarios` - Estadísticas de usuarios
- `GET /api/estadisticas/ingresos` - Estadísticas de ingresos

## 🛡️ Middleware de Seguridad

### **Autenticación JWT**
```javascript
// Protege rutas que requieren autenticación
const auth = require('./middlewares/auth');
```

### **Validación de Administrador**
```javascript
// Protege rutas solo para administradores
const adminAuth = require('./middlewares/adminAuth');
```

### **Validaciones de Entrada**
```javascript
// Express-validator para validar datos
const { validacionesCrearUsuario } = require('./middlewares/usuariosValidation');
const { validacionesCrearCancha } = require('./middlewares/canchasValidation');
const { validacionesCrearTurno } = require('./middlewares/turnosValidation');
```

### **Rate Limiting**
```javascript
// Limita requests por IP
const rateLimit = require('express-rate-limit');
```

## 📁 Estructura del Proyecto

```
Backend/
├── app.js                 # Servidor principal
├── Config/
│   └── db.js             # Configuración de MySQL
├── Rutas/
│   ├── Usuario.js        # Rutas de usuarios y autenticación
│   ├── Canchas.js        # Rutas de canchas
│   ├── Turnos.js         # Rutas de turnos/reservas
│   └── Estadisticas.js   # Rutas de estadísticas (Admin)
├── middlewares/
│   ├── auth.js           # Autenticación JWT
│   ├── adminAuth.js      # Verificación de admin
│   ├── usuariosValidation.js
│   ├── canchasValidation.js
│   └── turnosValidation.js
├── utils/
│   ├── email.js          # Configuración de Nodemailer
│   └── test-email.js     # Test de email
└── package.json
```

## 🔒 Características de Seguridad

### **Autenticación**
- JWT tokens para sesiones
- Bcrypt para hash de contraseñas
- Middleware de autenticación en rutas protegidas

### **Validación de Datos**
- Express-validator en todos los endpoints
- Sanitización de entradas
- Validación de tipos de datos

### **Protección de Endpoints**
- Rate limiting para prevenir abuso
- CORS configurado
- Helmet para headers de seguridad
- Validación de roles (admin/usuario)

### **Base de Datos**
- Prepared statements (previene SQL injection)
- Foreign keys con integridad referencial
- Soft delete para auditoría

## 📧 Sistema de Notificaciones

### **Configuración de Email**
```javascript
// utils/email.js
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### **Notificaciones Automáticas**
- Confirmación de reservas
- Cancelación de turnos
- Notificaciones administrativas

## 🧪 Testing

```bash
# Probar configuración de email
npm run test:email

# Verificar conexión a base de datos
node -e "require('./Config/db.js')"
```

## 🚨 Reglas de Desarrollo

1. **NUNCA** commitear `.env`
2. **Validar** todas las entradas de usuario
3. **Implementar** rate limiting en endpoints públicos
4. **Documentar** cambios en el schema de BD
5. **Testing** obligatorio antes de merge

## 🔧 Dependencias Principales

```json
{
  "express": "^5.1.0",           // Framework web
  "mysql2": "^3.15.3",           // Cliente MySQL
  "jsonwebtoken": "^9.0.2",      // Autenticación JWT
  "bcrypt": "^5.1.1",            // Hash de contraseñas
  "express-validator": "^7.3.0",  // Validación de datos
  "nodemailer": "^7.0.10",       // Envío de emails
  "cors": "^2.8.5",              // CORS
  "helmet": "^7.2.0",            // Seguridad headers
  "express-rate-limit": "^7.5.1", // Rate limiting
  "morgan": "^1.10.1",           // Logging HTTP
  "dotenv": "^16.6.1"            // Variables de entorno
}

