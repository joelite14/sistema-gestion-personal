import { Router } from 'express';
import db from '../config/db';

const router = Router();

// ============================================
// 📋 GET /api/niveles - Obtener todos los niveles
// ============================================
router.get('/niveles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cat_niveles_por_cargo ORDER BY cargo_tipo, orden');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 📋 GET /api/niveles/:cargo - Obtener niveles por cargo
// ============================================
router.get('/niveles/cargo/:cargo', async (req, res) => {
  try {
    const { cargo } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM cat_niveles_por_cargo WHERE cargo_tipo = ? ORDER BY orden',
      [cargo]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// ➕ POST /api/niveles - Crear nuevo nivel
// ============================================
router.post('/niveles', async (req, res) => {
  try {
    const { cargo_tipo, nivel, codigo, orden } = req.body;
    
    const [result]: any = await db.query(
      'INSERT INTO cat_niveles_por_cargo (cargo_tipo, nivel, codigo, orden) VALUES (?, ?, ?, ?)',
      [cargo_tipo, nivel, codigo, orden || 0]
    );
    
    res.json({ success: true, message: 'Nivel creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// ✏️ PUT /api/niveles/:id - Actualizar nivel
// ============================================
router.put('/niveles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cargo_tipo, nivel, codigo, orden, activo } = req.body;
    
    await db.query(
      'UPDATE cat_niveles_por_cargo SET cargo_tipo = ?, nivel = ?, codigo = ?, orden = ?, activo = ? WHERE id = ?',
      [cargo_tipo, nivel, codigo, orden || 0, activo !== undefined ? activo : true, id]
    );
    
    res.json({ success: true, message: 'Nivel actualizado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 🗑️ DELETE /api/niveles/:id - Eliminar nivel
// ============================================
router.delete('/niveles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el nivel está siendo usado por algún empleado
    const [usado]: any = await db.query(
      'SELECT COUNT(*) as total FROM personal WHERE nivel_academico = (SELECT nivel FROM cat_niveles_por_cargo WHERE id = ?)',
      [id]
    );
    
    if (usado[0].total > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar porque hay empleados con este nivel' 
      });
    }
    
    await db.query('DELETE FROM cat_niveles_por_cargo WHERE id = ?', [id]);
    res.json({ success: true, message: 'Nivel eliminado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;