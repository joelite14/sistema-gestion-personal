import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import fs from 'fs'; // 👈 NUEVA LÍNEA (solo esta)
import db from './config/db';
import personalRoutes from './routes/personalRoutes';
import reportesRoutes from './routes/reportesRoutes';
import repososRoutes from './routes/repososRoutes';
import nivelesRoutes from './routes/nivelesRoutes';
import dependenciasRoutes from './routes/dependenciasRoutes';
import authRoutes from './routes/authRoutes';

// 👈 NUEVO BLOQUE (solo esto se agrega)
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('📁 Carpeta uploads creada');
}





const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', personalRoutes);
app.use('/api', reportesRoutes);
app.use('/api', repososRoutes);
app.use('/api', nivelesRoutes);
app.use('/api', dependenciasRoutes);
app.use('/api', authRoutes);




app.get('/', (req, res) => {
  res.send('Servidor de E.B.N. Dr. Vicente Peña funcionando ✅');
});

// ============================================
// RUTA DE LOGIN CON BITÁCORA
// ============================================
app.post('/api/login', async (req, res) => {
  const { cedula, password } = req.body;

  console.log("-----------------------------------------");
  console.log("🔍 DATOS RECIBIDOS DESDE EL LOGIN:");
  console.log("Cédula:", cedula);
  console.log("Clave:", password);

  try {
    const [rows]: any = await db.query(
      'SELECT id, nombre, rol FROM usuarios WHERE cedula = ? AND password = ?',
      [cedula, password]
    );

    console.log("📊 RESULTADO EN MYSQL:", rows);
    console.log("-----------------------------------------");

    if (rows.length > 0) {
      const user = rows[0];

      // 📝 REGISTRAR EN BITÁCORA (inicio de sesión)
      try {
        await db.query(
          'INSERT INTO bitacora (usuario_id, usuario_nombre, accion, modulo) VALUES (?, ?, ?, ?)',
          [user.id, user.nombre, 'Inició sesión', 'Login']
        );
        console.log("✅ Bitácora: Inicio de sesión registrado");
      } catch (bitacoraError) {
        console.error("❌ Error al registrar en bitácora:", bitacoraError);
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          nombre: user.nombre,
          rol: user.rol,
          cedula: cedula
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Datos incorrectos'
      });
    }
  } catch (error) {
    console.error("❌ ERROR CRÍTICO:", error);
    res.status(500).json({
      success: false,
      message: 'Error interno en el servidor'
    });
  }
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

app.use('/uploads', express.static('uploads'));