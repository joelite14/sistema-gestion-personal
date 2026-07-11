import nodemailer from 'nodemailer';

// Verificar que las variables de entorno estén cargadas
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('📧 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ CONFIGURADO' : '❌ VACÍO');

// Configuración SMTP para Gmail (SIN valores por defecto)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Función para enviar correo de recuperación
export const sendPasswordResetEmail = async (email: string, nombre: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Recuperación de Contraseña - E.B.N. Dr. Vicente Peña',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <tr>
                  <td align="center" style="border-bottom: 3px solid #1a3a5c; padding-bottom: 20px;">
                    <h1 style="color: #1a3a5c; margin: 0;">E.B.N. Dr. Vicente Peña</h1>
                    <p style="color: #666; margin: 5px 0 0 0;">Sistema de Gestión de Personal</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0;">
                    <h2 style="color: #1a3a5c;">Recuperación de Contraseña</h2>
                    <p style="color: #333; line-height: 1.6;">Hola <strong>${nombre}</strong>,</p>
                    <p style="color: #333; line-height: 1.6;">Hemos recibido una solicitud para restablecer tu contraseña.</p>
                    <p style="color: #333; line-height: 1.6;">Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" style="background-color: #1a3a5c; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        🔐 Restablecer Contraseña
                      </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; line-height: 1.6;">Este enlace expirará en <strong>1 hora</strong>.</p>
                    <p style="color: #666; font-size: 14px; line-height: 1.6;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      Este es un correo automático, por favor no responder.
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                      E.B.N. Dr. Vicente Peña • San Juan de los Morros • Estado Guárico
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    console.log(`📧 Enviando correo a ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de recuperación enviado a ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error('❌ Error al enviar correo:');
    console.error('📝 Mensaje:', error.message);
    console.error('📝 Código:', error.code);
    if (error.response) {
      console.error('📝 Detalle:', error.response);
    }
    throw new Error('Error al enviar el correo de recuperación');
  }
};

export default transporter;