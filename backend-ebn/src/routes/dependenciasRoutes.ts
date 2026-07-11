import { Router } from 'express';
import db from '../config/db';

const router = Router();

// GET /api/dependencias - Obtener todas las dependencias
router.get('/dependencias', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cat_dependencias ORDER BY orden, codigo');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// POST /api/dependencias - Crear nueva dependencia
router.post('/dependencias', async (req, res) => {
  try {
    const { codigo, nombre, orden } = req.body;
    const [result]: any = await db.query(
      'INSERT INTO cat_dependencias (codigo, nombre, orden) VALUES (?, ?, ?)',
      [codigo, nombre, orden || 0]
    );
    res.json({ success: true, message: 'Dependencia creada', id: result.insertId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// PUT /api/dependencias/:id - Actualizar dependencia
router.put('/dependencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, orden, activo } = req.body;
    await db.query(
      'UPDATE cat_dependencias SET codigo = ?, nombre = ?, orden = ?, activo = ? WHERE id = ?',
      [codigo, nombre, orden || 0, activo !== undefined ? activo : true, id]
    );
    res.json({ success: true, message: 'Dependencia actualizada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// DELETE /api/dependencias/:id - Eliminar dependencia
router.delete('/dependencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM cat_dependencias WHERE id = ?', [id]);
    res.json({ success: true, message: 'Dependencia eliminada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;