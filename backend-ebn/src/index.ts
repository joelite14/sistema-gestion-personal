import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path'; 
import fs from 'fs';
import db from './config/db';
import personalRoutes from './routes/personalRoutes';
import reportesRoutes from './routes/reportesRoutes';
import repososRoutes from './routes/repososRoutes';
import nivelesRoutes from './routes/nivelesRoutes';
import dependenciasRoutes from './routes/dependenciasRoutes';
import authRoutes from './routes/authRoutes';

// Crear carpeta uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('📁 Carpeta uploads creada');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ============================================
// 📌 1. PRIMERO: RUTAS DE API
// ============================================
app.use('/api', personalRoutes);
app.use('/api', reportesRoutes);
app.use('/api', repososRoutes);
app.use('/api', nivelesRoutes);
app.use('/api', dependenciasRoutes);
app.use('/api', authRoutes);

// Ruta de login (ya está definida aquí abajo)
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

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor de E.B.N. Dr. Vicente Peña funcionando ✅');
});

// ============================================
// 📌 2. DESPUÉS: SERVIR EL FRONTEND
// ============================================
const frontendPath = path.join(__dirname, '../../frontend-ebn/dist');
console.log("📁 Sirviendo frontend desde:", frontendPath);

// Verificar si existe la carpeta del frontend
if (!fs.existsSync(frontendPath)) {
  console.error(`❌ ERROR: No se encontró la carpeta del frontend en: ${frontendPath}`);
  console.error('   Asegúrate de haber ejecutado "npm run build" en la carpeta frontend-ebn');
} else {
  console.log('✅ Frontend encontrado, sirviendo archivos estáticos');
  app.use(express.static(frontendPath));
  
  // Todas las rutas que NO sean API, redirigen al index.html de React
  app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`❌ No se encontró index.html en: ${indexPath}`);
      res.status(404).send('Frontend no construido correctamente');
    }
  });
}

// ============================================
// INICIO DEL SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});