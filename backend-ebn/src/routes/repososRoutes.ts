import { Router } from 'express';
import db from '../config/db';

const router = Router();

// ============================================
// 📝 FUNCIÓN PARA REGISTRAR EN BITÁCORA (CORREGIDA)
// ============================================
const registrarBitacora = async (usuario_id: number, usuario_nombre: string, accion: string, modulo: string, registro_id?: number) => {
  try {
    console.log("📝 Bitácora - ID:", usuario_id, "Nombre:", usuario_nombre, "Acción:", accion);
    await db.query(
      'INSERT INTO bitacora (usuario_id, usuario_nombre, accion, modulo, registro_id) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, usuario_nombre, accion, modulo, registro_id || null]
    );
    console.log("✅ Bitácora registrada:", accion, "por", usuario_nombre);
  } catch (error) {
    console.error('❌ Error al registrar bitácora:', error);
  }
};

// Obtener todos los permisos/reposos
router.get('/permisos-reposos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM permisos_reposos ORDER BY fecha_inicio DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener permisos/reposos:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Obtener reposos y permisos ACTIVOS con datos del empleado (para el Dashboard)
router.get('/permisos-reposos/activos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pr.*, p.nombres, p.apellidos, p.cedula, p.foto_url
       FROM permisos_reposos pr
       JOIN personal p ON pr.personal_id = p.id_personal
       WHERE pr.estatus = 'Activo' 
       ORDER BY pr.fecha_fin ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener reposos/permisos activos:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Crear nuevo permiso/reposo (CON VALIDACIONES CORREGIDAS)
router.post('/permisos-reposos', async (req, res) => {
  try {
    const { personal_id, tipo, fecha_inicio, fecha_fin, motivo, usuario_id, usuario_nombre } = req.body;
    
    console.log("📝 Datos recibidos:", req.body);
    
    if (!personal_id || !tipo || !fecha_inicio) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }
    
    // VALIDACIÓN 1: Verificar si el empleado ya tiene un registro ACTIVO del OTRO tipo
    const otroTipo = tipo.includes('Reposo') ? 'Permiso' : 'Reposo';
    const [existeOtro]: any = await db.query(
      'SELECT * FROM permisos_reposos WHERE personal_id = ? AND tipo = ? AND estatus = "Activo"',
      [personal_id, otroTipo]
    );
    
    if (existeOtro.length > 0) {
      const mensaje = `El empleado ya tiene un ${otroTipo} activo. Debe finalizarlo antes de registrar este ${tipo}.`;
      return res.status(400).json({ success: false, message: mensaje });
    }
    
    // VALIDACIÓN 2: Verificar si el empleado ya tiene un registro ACTIVO del MISMO tipo
    const [mismoTipo]: any = await db.query(
      'SELECT * FROM permisos_reposos WHERE personal_id = ? AND tipo = ? AND estatus = "Activo"',
      [personal_id, tipo]
    );
    
    if (mismoTipo.length > 0) {
      return res.status(400).json({ success: false, message: `El empleado ya tiene un ${tipo} activo actualmente.` });
    }
    
    // Obtener nombre del empleado para la bitácora
    const [empleado]: any = await db.query('SELECT nombres, apellidos FROM personal WHERE id_personal = ?', [personal_id]);
    const nombreEmpleado = empleado[0] ? `${empleado[0].nombres} ${empleado[0].apellidos}` : 'Empleado desconocido';
    
    const [result]: any = await db.query(
      `INSERT INTO permisos_reposos (personal_id, tipo, fecha_inicio, fecha_fin, motivo, estatus) 
       VALUES (?, ?, ?, ?, ?, 'Activo')`,
      [personal_id, tipo, fecha_inicio, fecha_fin || null, motivo || null]
    );
    
    // Actualizar el campo correspondiente en personal (CORREGIDO: usa includes)
    if (tipo.includes('Reposo')) {
      await db.query('UPDATE personal SET en_reposo = TRUE WHERE id_personal = ?', [personal_id]);
    } else if (tipo.includes('Permiso')) {
      await db.query('UPDATE personal SET en_permiso = TRUE WHERE id_personal = ?', [personal_id]);
    }
    
    // ✅ Registrar en bitácora con el orden CORRECTO
    await registrarBitacora(
      usuario_id || 1,           // usuario_id
      usuario_nombre || 'Sistema', // usuario_nombre
      `Registró ${tipo} para ${nombreEmpleado}`,
      'Reposos/Permisos',
      result.insertId
    );
    
    res.json({ success: true, message: `${tipo} registrado exitosamente`, id: result.insertId });
  } catch (error) {
    console.error('Error al registrar permiso/reposo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Finalizar permiso/reposo (CON VALIDACIÓN MEJORADA Y CORREGIDA)
router.put('/permisos-reposos/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, usuario_nombre } = req.body;
    
    const [reposo]: any = await db.query('SELECT personal_id, tipo FROM permisos_reposos WHERE id = ? AND estatus = "Activo"', [id]);
    
    if (reposo.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado o ya finalizado' });
    }
    
    // Obtener nombre del empleado
    const [empleado]: any = await db.query('SELECT nombres, apellidos FROM personal WHERE id_personal = ?', [reposo[0].personal_id]);
    const nombreEmpleado = empleado[0] ? `${empleado[0].nombres} ${empleado[0].apellidos}` : 'Empleado desconocido';
    
    await db.query('UPDATE permisos_reposos SET estatus = "Finalizado", fecha_fin = CURDATE() WHERE id = ?', [id]);
    
    // Verificar si el empleado tiene otros registros ACTIVOS del MISMO tipo
    const [activos]: any = await db.query(
      'SELECT COUNT(*) as total FROM permisos_reposos WHERE personal_id = ? AND tipo = ? AND estatus = "Activo"',
      [reposo[0].personal_id, reposo[0].tipo]
    );
    
    if (activos[0].total === 0) {
      // Actualizar el campo correspondiente en personal (CORREGIDO: usa includes)
      if (reposo[0].tipo.includes('Reposo')) {
        await db.query('UPDATE personal SET en_reposo = FALSE WHERE id_personal = ?', [reposo[0].personal_id]);
      } else if (reposo[0].tipo.includes('Permiso')) {
        await db.query('UPDATE personal SET en_permiso = FALSE WHERE id_personal = ?', [reposo[0].personal_id]);
      }
    }
    
    // ✅ Registrar en bitácora con el orden CORRECTO
    await registrarBitacora(
      usuario_id || 1,           // usuario_id
      usuario_nombre || 'Sistema', // usuario_nombre
      `Finalizó ${reposo[0].tipo} de ${nombreEmpleado}`,
      'Reposos/Permisos',
      parseInt(id)
    );
    
    res.json({ success: true, message: `${reposo[0].tipo} finalizado correctamente` });
  } catch (error) {
    console.error('Error al finalizar:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// NUEVO ENDPOINT: Obtener estado real del empleado (prioriza Reposo/Permiso sobre estatus)
router.get('/personal/:id/estado-real', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [activo]: any = await db.query(
      'SELECT tipo, fecha_fin FROM permisos_reposos WHERE personal_id = ? AND estatus = "Activo" ORDER BY fecha_fin ASC LIMIT 1',
      [id]
    );
    
    if (activo.length > 0) {
      return res.json({ 
        success: true, 
        data: { 
          estado: activo[0].tipo,
          fecha_fin: activo[0].fecha_fin 
        } 
      });
    }
    
    const [empleado]: any = await db.query('SELECT estatus FROM personal WHERE id_personal = ?', [id]);
    
    res.json({ 
      success: true, 
      data: { 
        estado: empleado[0]?.estatus || 'Activo', 
        fecha_fin: null 
      } 
    });
  } catch (error) {
    console.error('Error al obtener estado real:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Obtener estadísticas completas
router.get('/estadisticas-completas', async (req, res) => {
  try {
    const [cargos] = await db.query(`
      SELECT 
        SUM(CASE WHEN LOWER(cargo) = 'docente' THEN 1 ELSE 0 END) AS docentes,
        SUM(CASE WHEN LOWER(cargo) = 'administrativo' THEN 1 ELSE 0 END) AS administrativos,
        SUM(CASE WHEN LOWER(cargo) = 'obrero' THEN 1 ELSE 0 END) AS obreros,
        SUM(CASE WHEN LOWER(cargo) = 'vigilante' THEN 1 ELSE 0 END) AS vigilantes,
        SUM(CASE WHEN LOWER(cargo) = 'cnae' THEN 1 ELSE 0 END) AS cnae,
        COUNT(*) AS total
      FROM personal
    `);

    const [repososPermisos] = await db.query(`
      SELECT 
        SUM(CASE WHEN tipo LIKE '%Reposo%' THEN 1 ELSE 0 END) AS reposo,
        SUM(CASE WHEN tipo LIKE '%Permiso%' THEN 1 ELSE 0 END) AS permiso
      FROM permisos_reposos
      WHERE estatus = 'Activo'
    `);

    const idsConReposo = (await db.query(`
      SELECT personal_id FROM permisos_reposos WHERE estatus = 'Activo'
    `))[0] as any[];

    let activos = 0, inactivos = 0, jubilados = 0;

    if (idsConReposo.length === 0) {
      const [estatusBase] = await db.query(`
        SELECT 
          SUM(CASE WHEN estatus = 'Activo' THEN 1 ELSE 0 END) AS activos,
          SUM(CASE WHEN estatus = 'Inactivo' THEN 1 ELSE 0 END) AS inactivos,
          SUM(CASE WHEN estatus = 'Jubilado' THEN 1 ELSE 0 END) AS jubilados
        FROM personal
      `);
      activos = (estatusBase as any[])[0].activos;
      inactivos = (estatusBase as any[])[0].inactivos;
      jubilados = (estatusBase as any[])[0].jubilados;
    } else {
      const ids = idsConReposo.map((row: any) => row.personal_id);
      const placeholders = ids.map(() => '?').join(',');
      const [estatusFiltrado] = await db.query(
        `SELECT 
          SUM(CASE WHEN estatus = 'Activo' THEN 1 ELSE 0 END) AS activos,
          SUM(CASE WHEN estatus = 'Inactivo' THEN 1 ELSE 0 END) AS inactivos,
          SUM(CASE WHEN estatus = 'Jubilado' THEN 1 ELSE 0 END) AS jubilados
        FROM personal
        WHERE id_personal NOT IN (${placeholders})`,
        ids
      );
      activos = (estatusFiltrado as any[])[0].activos;
      inactivos = (estatusFiltrado as any[])[0].inactivos;
      jubilados = (estatusFiltrado as any[])[0].jubilados;
    }

    res.json({
      success: true,
      data: {
        total: (cargos as any[])[0].total,
        docentes: (cargos as any[])[0].docentes,
        administrativos: (cargos as any[])[0].administrativos,
        obreros: (cargos as any[])[0].obreros,
        vigilantes: (cargos as any[])[0].vigilantes,
        cnae: (cargos as any[])[0].cnae,
        activos,
        inactivos,
        jubilados,
        reposo: (repososPermisos as any[])[0].reposo,
        permiso: (repososPermisos as any[])[0].permiso
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas completas:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;