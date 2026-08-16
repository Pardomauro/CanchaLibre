import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { enviarCorreo } from '../servicios/EmailServicio.js';
import { generarToken, protegerRuta, verificarRol } from '../servicios/token.js';
import {
    validarCampos,
    manejarErrorServidor,
    validacionesRegistroUsuario,
    validacionesLogin,
    validacionesCrearUsuario,
    validacionesObtenerUsuario,
    validacionesActualizarUsuario,
    validacionesEliminarUsuario,
    validacionesRecuperarContrasena,
    validacionesVerificarCodigo
} from '../middlewares/index.js';
import { validarEmail, validarCamposActualizacion } from '../middlewares/helpers.js';

const router = express.Router();

// Ruta para obtener todos los usuarios

router.get('/', [
    protegerRuta,
    verificarRol(['administrador'])
], async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT 
            id_usuario, 
            nombre,  
            email,
            celular
            FROM usuarios
            ORDER BY id_usuario ASC
    `);

        res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos correctamente',
            data: rows,
            total: rows.length
        });

    } catch (error) {
        return manejarErrorServidor(error, 'obtener usuarios', res);
    }
});

// Ruta para crear un nuevo usuario (solo administrador)
router.post('/', [
    protegerRuta,
    verificarRol(['administrador']),
    ...validacionesCrearUsuario,
    validarCampos
], async (req, res) => {
    try {
        const { nombre, email, celular, password } = req.body;

        // Verificar si el email ya existe
        const [existingUser] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Encriptar la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar el nuevo usuario
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, celular, password) VALUES (?, ?, ?, ?)',
            [nombre, email, celular, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                id_usuario: result.insertId,
                nombre,
                email,
                celular
            }
        });

    } catch (error) {
        return manejarErrorServidor(error, 'crear usuario', res);
    }
});

// Obtenemos usuario específico por su ID
router.get('/:id', [
    ...validacionesObtenerUsuario,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`SELECT 
            id_usuario, 
            nombre, 
            email 
            FROM usuarios 
            WHERE id_usuario = ?`, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario obtenido correctamente',
            data: rows[0]
        });

    } catch (error) {
        return manejarErrorServidor(error, 'obtener usuario específico', res);
    }
});





// Ruta para "registrar" un nuevo usuario (crear cuenta)
router.post('/registrar', [
    ...validacionesRegistroUsuario,
    validarCampos
], async (req, res) => {
    try {
        const { nombre, email, celular, password } = req.body;

        // Validar que se proporcionen los campos necesarios
        if (!nombre || !email || !celular || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar formato del email

        if(!validarEmail(email)){
            return res.status(400).json({
                success: false,
                message: 'El formato del email no es válido'
            });
        }

        // Verificar si el usuario existe
        const [usuarioExistente] = await pool.execute(
            'SELECT id_usuario FROM usuarios WHERE email = ?',
            [email.toLowerCase()]
        );
        
        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El usuario ya existe'
            });
        }

        // Hashear la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar el nuevo usuario en la base de datos 
        const [resultado] = await pool.execute(
            'INSERT INTO usuarios (nombre, email, celular, password) VALUES (?, ?, ?, ?)',
            [nombre.trim(), email.toLowerCase(), celular.trim(), hashedPassword]
        );

        // Obtener datos del usuario creado sin su contraseña
        const [nuevoUsuario] = await pool.execute(
            'SELECT id_usuario, nombre, email, celular FROM usuarios WHERE id_usuario = ?',
            [resultado.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario creado correctamente',
            user: nuevoUsuario[0]
        });

    } catch (error) {
        return manejarErrorServidor(error, 'registrar usuario', res);
    }
});



// Ruta para login de usuario (iniciar sesión)
router.post('/login', [
    ...validacionesLogin,
    validarCampos
], async (req, res) => {
    try{
        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son obligatorios'
            });
        }

        // Buscar usuario por email
        const [usuarios] = await pool.execute(
            'SELECT id_usuario, nombre, email, password, rol FROM usuarios WHERE email = ?',
            [email.toLowerCase()]
        ); 

        if (usuarios.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        
        }

        const usuario = usuarios[0];

        // Comparar contraseñas 
        const passwordMatch = await bcrypt.compare(password, usuario.password);

        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña incorrecta'
                
            });
        }

        // Generar token JWT
        const token = generarToken({
            id: usuario.id_usuario,
            email: usuario.email,
            rol: usuario.rol || 'usuario'
        });

        // Remover la contraseña antes de enviar la respuesta
        const { password: _, ...usuarioSinPassword } = usuario;

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token: token,
            userId: usuario.id_usuario,
            role: usuario.rol || 'usuario',
            user: usuarioSinPassword
        });

    } catch (error) {
        return manejarErrorServidor(error, 'iniciar sesión', res);
    }
});
 


// Ruta para actualizar un usuario existente
router.put('/:id', [
    protegerRuta,
    ...validacionesActualizarUsuario,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, celular, password } = req.body;

        // Verificar que el usuario exista
        const [usuarioExistente] = await pool.execute(
            'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
            [id]
        );

        if (usuarioExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Validar que al menos un campo sea enviado para actualizar
        const camposPermitidos = ['nombre', 'email', 'celular', 'password'];
        if (!validarCamposActualizacion(req.body, camposPermitidos)) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar'
            });
        }

        // Validar formato de email
        if (!validarEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del email no es válido'
            });
        }

        // Verificar si el nuevo email ya está en uso por otro usuario
        const [usuario] = await pool.execute(
            'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?',
            [email.toLowerCase(), id]
        );

        if (usuario.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está en uso por otro usuario'
            });
        }

        // Construir la consulta de actualización
        let actualizarConsulta = 'UPDATE usuarios SET nombre = ?, email = ?, celular = ?';
        const actualizarParametros = [nombre.trim(), email.toLowerCase(), celular.trim()];

        // Verificar si se proporciona una nueva contraseña
        if (password) {
            // Validar la nueva contraseña
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Hashear la nueva contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            actualizarConsulta += ', password = ?';
            actualizarParametros.push(hashedPassword);
        }

        actualizarConsulta += ' WHERE id_usuario = ?';
        actualizarParametros.push(id);

        // Ejecutar la consulta de actualización
        await pool.execute(actualizarConsulta, actualizarParametros);

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        return manejarErrorServidor(error, 'actualizar usuario', res);
    }
});
 
 
// Ruta para eliminar un usuario   
router.delete('/:id', [
    ...validacionesEliminarUsuario,
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params; // Corregido: Extraer correctamente el parámetro

        // Verificar que el usuario exista
        const [usuarios] = await pool.execute(
            'SELECT * FROM usuarios WHERE id_usuario = ?', [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Eliminamos el usuario de la base de datos
        await pool.execute(
            'DELETE FROM usuarios WHERE id_usuario = ?', [id]
        );

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        return manejarErrorServidor(error, 'eliminar usuario', res);
    }
});


// Ruta para recuperación de contraseña


router.post('/recuperar-contrasena', [
    ...validacionesRecuperarContrasena,
    validarCampos
], async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar si el correo existe en la base de datos
    const [usuario] = await pool.execute(
      'SELECT id_usuario, nombre, email FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );

    if (usuario.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const usuarioEncontrado = usuario[0];

    // Generar código de verificación de 6 dígitos
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Establecer tiempo de expiración (15 minutos)
    const tiempoExpiracion = new Date();
    tiempoExpiracion.setMinutes(tiempoExpiracion.getMinutes() + 15);

    // Guardar código de verificación en la base de datos
    await pool.execute(
      'UPDATE usuarios SET codigo_verificacion = ?, codigo_expiracion = ? WHERE id_usuario = ?',
      [codigoVerificacion, tiempoExpiracion, usuarioEncontrado.id_usuario]
    );

    // Enviar correo con el código de verificación
    await enviarCorreo({
      destinatario: email,
      asunto: 'Código de Verificación - Sistema Turnos Padel',
      contenidoHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Recuperación de Contraseña</h2>
          <p>Hola ${usuarioEncontrado.nombre},</p>
          <p>Has solicitado restablecer tu contraseña.</p>
          <p>Tu código de verificación es:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 8px;">${codigoVerificacion}</h1>
          </div>
          <p><strong>Este código expirará en 15 minutos.</strong></p>
          <p>Ingresa este código en la página de recuperación de contraseña para continuar.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'Se ha enviado un código de verificación a tu email' });
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    res.status(500).json({ success: false, message: 'Error interno al enviar el correo de recuperación.' });
  }
});



// Ruta para verificar código y restablecer contraseña
router.post('/verificar-codigo', [
    ...validacionesVerificarCodigo,
    validarCampos
], async (req, res) => {
  try {
    const { email, codigo, nuevaContrasena } = req.body;

    // Buscar usuario con el código de verificación
    const [usuario] = await pool.execute(
      'SELECT id_usuario, codigo_verificacion, codigo_expiracion FROM usuarios WHERE email = ? AND codigo_verificacion = ?',
      [email.toLowerCase(), codigo]
    );

    if (usuario.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación inválido'
      });
    }

    const usuarioEncontrado = usuario[0];

    // Verificar si el código ha expirado
    const ahora = new Date();
    const expiracion = new Date(usuarioEncontrado.codigo_expiracion);
    
    if (ahora > expiracion) {
      // Limpiar código expirado
      await pool.execute(
        'UPDATE usuarios SET codigo_verificacion = NULL, codigo_expiracion = NULL WHERE id_usuario = ?',
        [usuarioEncontrado.id_usuario]
      );
      
      return res.status(400).json({
        success: false,
        message: 'El código de verificación ha expirado. Solicita uno nuevo.'
      });
    }

    // Encriptar la nueva contraseña
    const saltRounds = 10;
    const hashContrasena = await bcrypt.hash(nuevaContrasena, saltRounds);

    // Actualizar contraseña y limpiar código de verificación
    await pool.execute(
      'UPDATE usuarios SET password = ?, codigo_verificacion = NULL, codigo_expiracion = NULL WHERE id_usuario = ?',
      [hashContrasena, usuarioEncontrado.id_usuario]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    });

  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno al verificar el código' 
    });
  }
});


export default router;