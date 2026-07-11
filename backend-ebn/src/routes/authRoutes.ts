import { Router } from 'express';
import db from '../config/db';
import { sendPasswordResetEmail } from '../config/mailer';
import crypto from 'crypto';

const router = Router();

// ============================================
// 📧 SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ============================================
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El correo electrónico es requerido' });
    }

    // Buscar usuario por email
    const [users]: any = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No existe un usuario con este correo electrónico' });
    }

    const user = users[0];

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await db.query(
      'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [token, expiresAt, user.id]
    );

    // Enviar correo
    await sendPasswordResetEmail(user.email, user.nombre, token);

    res.json({ 
      success: true, 
      message: 'Se ha enviado un correo con las instrucciones para restablecer tu contraseña' 
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
});

// ============================================
// 🔐 RESTABLECER CONTRASEÑA
// ============================================
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar usuario por token válido
    const [users]: any = await db.query(
      'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'El enlace es inválido o ha expirado' });
    }

    const user = users[0];

    // Actualizar contraseña
    await db.query(
      'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [newPassword, user.id]
    );

    res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
});

export default router;