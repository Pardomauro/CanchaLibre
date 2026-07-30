# 🎾 Sistema de Gestión de Turnos para Complejos Deportivos

Sistema completo de gestión de canchas y reservas deportivas con interfaz moderna, sistema de confirmaciones críticas y panel administrativo avanzado.

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- **Registro y login** de usuarios
- **Panel administrativo** con funciones avanzadas
- **Recuperación de contraseña** por email
- **Roles diferenciados**: Usuarios y Administradores

### 🏓 Gestión de Canchas
- **Vista de canchas** con disponibilidad en tiempo real
- **Administración completa** (crear, editar, eliminar)
- **Control de mantenimiento** y precios
- **Horarios configurables** por cancha

### 📅 Sistema de Reservas
- **Calendario interactivo** con horarios disponibles
- **Reservas instantáneas** con confirmación por email
- **Historial completo** de reservas
- **Filtrado** por próximas reservas y historial

### 🛡️ Acciones Críticas con Confirmación
- **Modal de confirmación** para todas las eliminaciones
- **Información detallada** antes de confirmar
- **Advertencias de seguridad** sobre irreversibilidad
- **Confirmación de reservas** con resumen completo

### 📊 Panel Administrativo
- **Dashboard** con estadísticas en tiempo real
- **Gestión de usuarios** con creación y eliminación segura
- **Vista global** de todas las reservas
- **Estadísticas** de ingresos, ocupación y usuarios

## 🚀 Inicio Rápido

### Opción 1: Desarrollo Completo (Recomendado)
```bash
cd Frontend/Frontend-TurnosPadel
npm run dev
```
*Inicia automáticamente backend + frontend*

### Opción 2: Desarrollo Separado
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend  
cd Frontend/Frontend-TurnosPadel
npm run frontend
```

## 🌐 URLs del Sistema

- **🖥️ Frontend**: http://localhost:5173
- **🔧 Backend API**: http://localhost:3000/api
- **💾 Base de datos**: MySQL (localhost:3306)

## 📱 Funcionalidades del Frontend

### 👤 Para Usuarios Normales
- **🔍 Explorar canchas** disponibles con precios
- **📅 Reservar turnos** con calendario interactivo
- **📋 Ver historial** de reservas propias
- **✅ Confirmar reservas** con resumen detallado
- **📧 Recibir confirmaciones** por email

### 👨‍💼 Para Administradores
- **🏗️ Gestionar canchas** (crear, editar, eliminar)
- **👥 Administrar usuarios** del sistema
- **📊 Ver estadísticas** completas
- **🗑️ Eliminar reservas** con confirmación crítica
- **⚙️ Crear reservas** para otros usuarios

## 🔒 Sistema de Seguridad Implementado

### 🛡️ Acciones Críticas Protegidas
Todas las eliminaciones requieren **confirmación explícita**:

#### **🗑️ Eliminar Canchas**
- Modal con detalles de la cancha
- Advertencia sobre reservas asociadas
- Confirmación de impacto en usuarios

#### **🗑️ Eliminar Reservas**
- Información completa de la reserva
- Detalles de usuario y horario
- Advertencias sobre irreversibilidad

#### **👥 Eliminar Usuarios**
- Datos completos del usuario
- Impacto en reservas futuras
- Sugerencias de alternativas (suspensión)

#### **✅ Confirmar Reservas**
- Resumen detallado antes de crear
- Validación de todos los campos
- Confirmación de disponibilidad

## 📁 Arquitectura del Sistema

```
Sistema_TurnosPadel/
├── Backend/                      # 🔧 Servidor Node.js/Express
│   ├── Config/                   # ⚙️ Configuración DB
│   ├── Rutas/                    # 📡 API Endpoints
│   │   ├── Usuario.js           # 👤 Usuarios + Autenticación
│   │   ├── Canchas.js           # 🏓 Gestión de canchas
│   │   ├── Turnos.js            # 📅 Sistema de reservas
│   │   └── Estadisticas.js      # 📊 Métricas del sistema
│   ├── middlewares/             # 🛡️ Validaciones y seguridad
│   ├── Servicios/               # 📧 Email y autenticación
│   └── scripts/                 # 🔧 Utilidades (crear admin)
│   └── tests/                   # 🔧 Testeos para configuraciones (emails)

│
└── Frontend/Frontend-TurnosPadel/  # 🖥️ Interfaz React
    ├── src/
    │   ├── api/                 # 🔌 Conexión con backend
    │   ├── components/          # 🧩 Componentes React
    │   │   ├── auth/
    │   │   ├── accionesCriticas/    # 🔒 Sistema de confirmación
    │   │   ├── rutas/              # 🗺️ Rutas de navegación
    │   │   └── navegacion/         # 🧭 Navegación
    │   ├── config/             #  🔧 Configuración para credenciales de Admin
    │   ├── pages/             #  🔧 Configuración para credenciales de Admin
    │   │   ├── admin/
    │   │   ├── canchas/
    │   │   ├── reservas/
    │   │   ├── usuario/
    │   ├── context/            # 🌐 Estado global (Auth)
    │   └── utils/              # 🛠️ Utilidades
    └── package.json
```

## 🎨 Componentes Clave del Frontend

### 🔒 Sistema de Confirmación (`accionesCriticas/`)
- **`ConfirmDialog.jsx`** - Modal universal de confirmación
- Soporte para tipos: `danger`, `warning`, `success`
- Mensajes complejos con JSX
- Botones personalizables

### 👨‍💼 Panel Admin (`admin/`)
- **`AdminDashboard.jsx`** - Dashboard principal
- **`GestionUsuarios.jsx`** - Administración de usuarios
- **`NuevaReserva.jsx`** - Crear reservas administrativas

### 🏓 Gestión de Canchas (`canchas/`)
- **`lista.jsx`** - Lista con acciones de admin
- **`crear-editar.jsx`** - Formularios de gestión
- **`detalles.jsx`** - Vista detallada de cancha

### 📅 Sistema de Reservas (`reservas/`)
- **`NuevaReservaUsuario.jsx`** - Crear reservas (consolidado)
- **`HistorialReservas.jsx`** - Vista unificada admin/usuario
- **`formulario.jsx`** - Formulario de reserva

### 🧭 Navegación (`navegacion/`)
- **`NavBar.jsx`** - Navegación responsive
- **`Footer.jsx`** - Pie de página
- Menús adaptativos según rol

## 📊 API Endpoints Principales

### 🔐 Autenticación
- `POST /api/usuarios/login` - Iniciar sesión
- `POST /api/usuarios/registrar` - Registrar usuario
- `POST /api/usuarios/recuperar-contrasena` - Recuperar password

### 🏓 Canchas
- `GET /api/canchas` - Listar todas las canchas
- `POST /api/canchas` - Crear cancha (Admin)
- `DELETE /api/canchas/:id` - Eliminar cancha (Admin)

### 📅 Turnos/Reservas
- `GET /api/turnos` - Todas las reservas (Admin)
- `GET /api/turnos/usuario/:id` - Reservas de usuario
- `POST /api/turnos` - Crear reserva
- `DELETE /api/turnos/:id` - Eliminar reserva (Admin)

### 👥 Usuarios
- `GET /api/usuarios` - Listar usuarios (Admin)
- `POST /api/usuarios` - Crear usuario (Admin)
- `DELETE /api/usuarios/:id` - Eliminar usuario (Admin)

### 📊 Estadísticas
- `GET /api/estadisticas` - Stats generales (Admin)
- `GET /api/estadisticas/ingresos` - Ingresos (Admin)
- `GET /api/estadisticas/reservas` - Métricas reservas (Admin)

## 🛠️ Tecnologías Utilizadas

### 🔧 Backend
- **Node.js** + **Express** - Servidor web
- **MySQL2** - Base de datos relacional
- **JWT** - Autenticación segura
- **Nodemailer** - Envío de emails
- **Bcrypt** - Encriptación de contraseñas
- **Express-Validator** - Validación de datos

### 🖥️ Frontend  
- **React 18** - Interfaz de usuario moderna
- **React Router DOM** - Navegación SPA
- **Tailwind CSS** - Diseño responsive
- **Vite** - Herramienta de desarrollo rápida
- **Context API** - Gestión de estado global

## 📋 Scripts Disponibles

### Frontend (`Frontend/Frontend-TurnosPadel/`)
```bash
npm run dev              # 🚀 Backend + Frontend simultáneamente
npm run frontend         # 🖥️ Solo frontend (Vite dev server)
npm run backend          # 🔧 Solo backend (desde frontend)
npm run build           # 📦 Build de producción
npm run preview         # 👀 Preview del build
```

### Backend (`Backend/`)
```bash
npm run dev             # 🔄 Desarrollo con nodemon
npm start              # ▶️ Producción con node
npm run test:email     # 📧 Test del servicio de email
node scripts/crearAdmin.js  # 👨‍💼 Crear usuario administrador
```

## 🔧 Configuración Inicial

### 1️⃣ Base de Datos
```sql
-- Se crea automáticamente con estructura:
├── usuarios (autenticación y roles)
├── canchas (gestión de canchas)
└── turnos (sistema de reservas)
```

### 2️⃣ Variables de Entorno
```bash
# Backend/.env (requerido)
DB_PASSWORD=tu_password_mysql
JWT_SECRET=clave_super_secreta
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=password_aplicacion_gmail

# Para crear administrador
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password_seguro
ADMIN_NAME=Administrador Sistema
```

### 3️⃣ Instalación
```bash
# Instalar dependencias backend
cd Backend && npm install

# Instalar dependencias frontend  
cd Frontend/Frontend-TurnosPadel && npm install
```

## 🚨 Resolución de Problemas



## 🎯 Características Destacadas

### 🚀 Experiencia de Usuario
- **Interfaz moderna** y responsiva
- **Confirmaciones inteligentes** para acciones críticas
- **Estados de carga** en todas las operaciones
- **Feedback visual** constante

### 🔒 Seguridad Avanzada
- **Validación en frontend y backend**
- **Confirmaciones detalladas** para eliminaciones
- **Protección de rutas** por roles
- **Encriptación** de contraseñas

### 📱 Responsive Design
- **Adaptativo** a todos los dispositivos
- **Navegación móvil** optimizada
- **Modales responsivos**
- **Tablas adaptativas**

## 👥 Equipo de Desarrollo
- **Mauro Pardo** - Full Stack Developer
- **Ezequiel Grasso** - Full Stack Developer

---

**🎉 Sistema completo de gestión de turnos con las mejores prácticas de desarrollo web moderno**
