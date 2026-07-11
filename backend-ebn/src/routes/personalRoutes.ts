import { Router } from 'express';
import db from '../config/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';

// ============================================
// 📝 FUNCIÓN PARA REGISTRAR EN BITÁCORA
// ============================================
const registrarBitacora = async (usuario_id: number, usuario_nombre: string, accion: string, modulo: string, registro_id?: number) => {
  try {
    await db.query(
      'INSERT INTO bitacora (usuario_id, usuario_nombre, accion, modulo, registro_id) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, usuario_nombre, accion, modulo, registro_id || null]
    );
    console.log("✅ Bitácora registrada:", accion);
  } catch (error) {
    console.error('❌ Error al registrar bitácora:', error);
  }
};

const router = Router();

// ============================================
// 📁 CONFIGURACIÓN DE MULTER PARA SUBIR ARCHIVOS
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
const uploadExcel = multer({ dest: 'uploads/' });

// ============================================
// 📋 GET /api/personal - Obtener todo el personal
// ============================================
router.get('/personal', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
  id_personal, cedula, nombres, apellidos, telefono, correo,
  fecha_nacimiento, edad, cargo, cod_cargo, nivel_academico,
  dependencia, fecha_ingreso, estatus, foto_url,
  en_reposo, en_permiso, genero, estado_civil, direccion,
  turno, dependencia_actual, dependencia_voucher,
  rif, rif_fecha, constancia_ubicacion, constancia_ubicacion_fecha,
  constancia_pago, constancia_pago_fecha,
  cedula_imagen, cedula_imagen_fecha
FROM personal
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 🔍 GET /api/personal/:id - Obtener un empleado por ID
// ============================================
router.get('/personal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows]: any = await db.query('SELECT * FROM personal WHERE id_personal = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// ➕ POST /api/personal - Registrar nuevo empleado
// ============================================
router.post('/personal', async (req, res) => {
  try {
    const {
      cedula, nombres, apellidos, telefono, correo,
      cargo, nivel_academico, dependencia, fecha_ingreso, 
      fecha_nacimiento, edad, estatus, cod_cargo,
      turno, dependencia_actual, dependencia_voucher
    } = req.body;

    console.log("📝 Datos recibidos en POST:", req.body);

    const [result]: any = await db.query(
      `INSERT INTO personal 
       (cedula, nombres, apellidos, telefono, correo, cargo, cod_cargo, 
        nivel_academico, dependencia, fecha_ingreso, fecha_nacimiento, edad, estatus,
        turno, dependencia_actual, dependencia_voucher) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cedula, nombres, apellidos, telefono, correo, cargo, cod_cargo || null,
        nivel_academico, dependencia, fecha_ingreso, fecha_nacimiento || null, 
        edad || null, estatus || 'Activo',
        turno || null, dependencia_actual || null, dependencia_voucher || null
      ]
    );

    const usuario_id = req.body.usuario_id || 1;
    const usuario_nombre = req.body.usuario_nombre || 'Administrador';

    await registrarBitacora(
      usuario_id,
      usuario_nombre,
      `Registró nuevo empleado: ${nombres} ${apellidos} (Cédula: ${cedula})`,
      'Personal',
      result.insertId
    );

    res.json({ 
      success: true, 
      message: 'Empleado registrado exitosamente',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// ✏️ PUT /api/personal/:id - Actualizar empleado
// ============================================
router.put('/personal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log("✏️ Actualizando empleado ID:", id);
    console.log("📦 Datos recibidos en PUT:", updates);
    
    const fields = [];
    const values = [];
    
    const allowedFields = ['cedula', 'nombres', 'apellidos', 'telefono', 'correo', 
                       'cargo', 'cod_cargo', 'nivel_academico', 'dependencia', 
                       'fecha_ingreso', 'fecha_nacimiento', 'edad', 'estatus',
                       'turno', 'dependencia_actual', 'dependencia_voucher',
                       'rif', 'rif_fecha', 'constancia_ubicacion', 'constancia_ubicacion_fecha',
                       'constancia_pago', 'constancia_pago_fecha',
                       'cedula_imagen', 'cedula_imagen_fecha'];
    
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }
    
    values.push(id);
    const query = `UPDATE personal SET ${fields.join(', ')} WHERE id_personal = ?`;
    
    console.log("📝 Query:", query);
    console.log("📝 Values:", values);
    
    await db.query(query, values);
    
    const usuario_nombre = updates.usuario_nombre || 'Administrador';
    const usuario_id = updates.usuario_id || 1;
    
    const [empleado]: any = await db.query('SELECT nombres, apellidos FROM personal WHERE id_personal = ?', [id]);
    const nombreEmpleado = empleado[0] ? `${empleado[0].nombres} ${empleado[0].apellidos}` : `ID ${id}`;
    
    await registrarBitacora(
      usuario_id,
      usuario_nombre,
      `Actualizó datos de ${nombreEmpleado}`,
      'Personal',
      parseInt(id)
    );
    
    res.json({ success: true, message: 'Empleado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 📄 SUBIR DOCUMENTO A UN EMPLEADO - CORREGIDO
// ============================================
router.post('/personal/:id/documentos', upload.single('archivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento } = req.body;
    
    // 🔥 Recibir usuario desde el frontend (FormData)
    const usuario_id = req.body.usuario_id || 1;
    const usuario_nombre = req.body.usuario_nombre || 'Administrador';
    
    console.log(`📄 Subiendo documento para empleado ${id} por ${usuario_nombre}`);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
    }

    const [empleado]: any = await db.query(
      'SELECT nombres, apellidos FROM personal WHERE id_personal = ?',
      [id]
    );
    const nombreEmpleado = empleado[0] 
      ? `${empleado[0].nombres} ${empleado[0].apellidos}` 
      : `ID ${id}`;

    const archivo_url = `/uploads/${req.file.filename}`;

    await db.query(
      'INSERT INTO documentos_expediente (personal_id, tipo_documento, archivo_url, subido_por) VALUES (?, ?, ?, ?)',
      [id, tipo_documento, archivo_url, usuario_id]
    );

    // 🔥 Registrar en bitácora con el nombre real
    await registrarBitacora(
      usuario_id,
      usuario_nombre,
      `Subió documento "${tipo_documento}" de ${nombreEmpleado}`,
      'Expedientes',
      parseInt(id)
    );

    console.log(`✅ Documento subido por ${usuario_nombre}`);

    res.json({ success: true, message: 'Documento subido exitosamente' });
  } catch (error) {
    console.error('❌ Error al subir documento:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 📋 OBTENER DOCUMENTOS DE UN EMPLEADO
// ============================================
router.get('/personal/:id/documentos', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM documentos_expediente WHERE personal_id = ? ORDER BY fecha_subida DESC',
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 🗑️ ELIMINAR DOCUMENTO
// ============================================
router.delete('/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 🔥 Los datos vienen en req.body para DELETE
    const usuario_id = req.body.usuario_id || 1;
    const usuario_nombre = req.body.usuario_nombre || 'Administrador';
    
    console.log(`🗑️ Eliminando documento ${id} por ${usuario_nombre} (ID: ${usuario_id})`);

    // Obtener información del documento antes de eliminarlo
    const [doc]: any = await db.query(
      'SELECT tipo_documento, archivo_url, personal_id FROM documentos_expediente WHERE id = ?',
      [id]
    );
    
    if (doc.length === 0) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    // Obtener nombre del empleado
    const [empleado]: any = await db.query(
      'SELECT nombres, apellidos FROM personal WHERE id_personal = ?',
      [doc[0].personal_id]
    );
    const nombreEmpleado = empleado[0] 
      ? `${empleado[0].nombres} ${empleado[0].apellidos}` 
      : `ID ${doc[0].personal_id}`;

    // Eliminar el archivo físico
    if (doc[0].archivo_url) {
      const filePath = path.join(__dirname, '../../', doc[0].archivo_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Archivo eliminado: ${filePath}`);
      }
    }
    
    // Eliminar el registro de la base de datos
    await db.query('DELETE FROM documentos_expediente WHERE id = ?', [id]);
    
    // 🔥 Registrar en bitácora con el nombre real
    await registrarBitacora(
      usuario_id,
      usuario_nombre,
      `Eliminó ${doc[0].tipo_documento} de ${nombreEmpleado}`,
      'Expedientes',
      doc[0].personal_id
    );
    
    console.log(`✅ Documento ${id} eliminado por ${usuario_nombre}`);
    
    res.json({ success: true, message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error al eliminar documento:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 📸 SUBIR FOTO DE PERFIL
// ============================================
router.post('/personal/:id/foto', upload.single('foto'), async (req, res) => {
  console.log("📸 Llegó petición de foto");
  console.log("ID del empleado:", req.params.id);
  
  try {
    const { id } = req.params;
    
    if (!req.file) {
      console.log("❌ No hay archivo");
      return res.status(400).json({ success: false, message: 'No se subió ninguna foto' });
    }

    const [empleado]: any = await db.query(
      'SELECT nombres, apellidos FROM personal WHERE id_personal = ?',
      [id]
    );
    
    const nombreEmpleado = empleado[0] 
      ? `${empleado[0].nombres} ${empleado[0].apellidos}` 
      : `ID ${id}`;
    
    console.log("👤 Empleado:", nombreEmpleado);

    const foto_url = `/uploads/${req.file.filename}`;
    console.log("✅ Foto guardada en:", foto_url);

    await db.query(
      'UPDATE personal SET foto_url = ? WHERE id_personal = ?',
      [foto_url, id]
    );

    const usuario_id = req.body.usuario_id || 1;
    const usuario_nombre = req.body.usuario_nombre || 'Administrador';

    await registrarBitacora(
      usuario_id,
      usuario_nombre,
      `Subió foto de perfil de ${nombreEmpleado}`,
      'Personal',
      parseInt(id)
    );

    res.json({ success: true, message: 'Foto subida exitosamente', foto_url });
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 📤 IMPORTAR PERSONAL DESDE EXCEL
// ============================================
router.post('/personal/importar-excel', uploadExcel.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    
    const datosReales = [];
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[0].toString().trim() !== '') {
        datosReales.push({
          cedula: row[0]?.toString() || '',
          nombres_apellidos: row[2]?.toString() || '',
          telefono_celular: row[8]?.toString() || '',
          email: row[10]?.toString() || '',
          tipo_personal: row[19]?.toString() || 'DOCENTE',
          nivel_instruccion: row[12]?.toString() || '',
          ubicacion_administrativa: row[14]?.toString() || ''
        });
      }
    }

    console.log(`📊 Se encontraron ${datosReales.length} empleados para importar`);

    let importados = 0;
    let errores = 0;

    for (const row of datosReales) {
      try {
        const nombreCompleto = row.nombres_apellidos || '';
        const partes = nombreCompleto.split(' ');
        const nombres = partes[0] || '';
        const apellidos = partes.slice(1).join(' ') || '';

        if (!row.cedula || !nombres) {
          errores++;
          continue;
        }

        const [existe]: any = await db.query('SELECT id_personal FROM personal WHERE cedula = ?', [row.cedula]);
        
        if (existe.length === 0) {
          await db.query(
            `INSERT INTO personal 
             (cedula, nombres, apellidos, telefono, correo, cargo, nivel_academico, dependencia, estatus) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.cedula, nombres, apellidos, row.telefono_celular, row.email, 
             row.tipo_personal, row.nivel_instruccion, row.ubicacion_administrativa, 'Activo']
          );
          importados++;
          console.log(`✅ Importado: ${nombres} ${apellidos} (${row.cedula})`);
        } else {
          errores++;
        }
      } catch (error) {
        console.error('Error al importar fila:', error);
        errores++;
      }
    }

    fs.unlinkSync(req.file.path);

    const usuario_id = req.body.usuario_id || 1;
    const usuario_nombre = req.body.usuario_nombre || 'Administrador';
    
    await registrarBitacora(
      usuario_id,
      usuario_nombre,
      `Importó ${importados} empleados desde Excel (${errores} errores)`,
      'Personal'
    );

    res.json({ 
      success: true, 
      message: `Importación completada: ${importados} empleados importados, ${errores} errores` 
    });
  } catch (error) {
    console.error('Error al importar Excel:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 📊 GET /api/bitacora - Obtener actividad reciente
// ============================================
router.get('/bitacora', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM bitacora ORDER BY fecha DESC LIMIT 10'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener bitácora:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 👥 RUTAS PARA USUARIOS (Configuración)
// ============================================

router.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, cedula, email, nombre, usuario, rol, fecha_creacion FROM usuarios');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

router.post('/usuarios', async (req, res) => {
  try {
    const { cedula, email, nombre, password, rol } = req.body;
    
    const usuario = cedula;
    
    const [result]: any = await db.query(
      'INSERT INTO usuarios (cedula, email, nombre, usuario, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [cedula, email, nombre, usuario, password, rol || 'admin']
    );
    res.json({ success: true, message: 'Usuario creado', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
});

router.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, email, nombre, password, rol } = req.body;
    
    // 🔥 USAR LA CÉDULA COMO NOMBRE DE USUARIO
    const usuario = cedula;
    
    if (password) {
      await db.query(
        'UPDATE usuarios SET cedula = ?, email = ?, nombre = ?, usuario = ?, password = ?, rol = ? WHERE id = ?',
        [cedula, email, nombre, usuario, password, rol, id]
      );
    } else {
      await db.query(
        'UPDATE usuarios SET cedula = ?, email = ?, nombre = ?, usuario = ?, rol = ? WHERE id = ?',
        [cedula, email, nombre, usuario, rol, id]
      );
    }
    res.json({ success: true, message: 'Usuario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
});

router.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar' });
  }
});

// ============================================
// 📄 SUBIR DOCUMENTO OBLIGATORIO - CORREGIDO
// ============================================
router.post('/personal/:id/documento-obligatorio', upload.single('archivo'), async (req, res) => {
  try {
    console.log('📥 Archivo recibido:', req.file);
    console.log('📥 Tipo de documento:', req.body.tipo_documento);
    console.log('📥 ID del empleado:', req.params.id);
    
    const { id } = req.params;
    const { tipo_documento } = req.body;
    
    // 🔥 Recibir usuario desde el frontend (FormData)
    const usuario_id = req.body.usuario_id || 1;
    const usuario_nombre = req.body.usuario_nombre || 'Administrador';
    
    console.log(`👤 Subiendo documento obligatorio por ${usuario_nombre} (ID: ${usuario_id})`);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
    }

    const campoMap: any = {
      'cedula_imagen': { archivo: 'cedula_imagen', fecha: 'cedula_imagen_fecha', nombre: 'Cédula (imagen)' },
      'rif': { archivo: 'rif', fecha: 'rif_fecha', nombre: 'RIF' },
      'constancia_ubicacion': { archivo: 'constancia_ubicacion', fecha: 'constancia_ubicacion_fecha', nombre: 'Constancia de Ubicación' },
      'constancia_pago': { archivo: 'constancia_pago', fecha: 'constancia_pago_fecha', nombre: 'Constancia de Pago' }
    };

    const campo = campoMap[tipo_documento];
    if (!campo) {
      console.log('❌ Tipo de documento no válido:', tipo_documento);
      return res.status(400).json({ success: false, message: 'Tipo de documento no válido' });
    }

    const archivo_url = `/uploads/${req.file.filename}`;
    const fecha_actual = new Date().toISOString().split('T')[0];

    await db.query(
      `UPDATE personal 
       SET ${campo.archivo} = ?, ${campo.fecha} = ? 
       WHERE id_personal = ?`,
      [archivo_url, fecha_actual, id]
    );

    const [empleado]: any = await db.query(
      'SELECT nombres, apellidos FROM personal WHERE id_personal = ?',
      [id]
    );
    const nombreEmpleado = empleado[0] 
      ? `${empleado[0].nombres} ${empleado[0].apellidos}` 
      : `ID ${id}`;

    // 🔥 Registrar en bitácora con el nombre real
    await registrarBitacora(
      usuario_id,
      usuario_nombre,
      `Subió ${campo.nombre} de ${nombreEmpleado}`,
      'Expedientes',
      parseInt(id)
    );

    console.log(`✅ ${campo.nombre} subido por ${usuario_nombre}`);

    res.json({ 
      success: true, 
      message: `${campo.nombre} subido exitosamente`,
      archivo: archivo_url,
      fecha: fecha_actual
    });

  } catch (error) {
    console.error('❌ Error al subir documento obligatorio:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ============================================
// 📜 OBTENER HISTORIAL DE CAMBIOS DE UN EMPLEADO
// ============================================
router.get('/personal/:id/historial', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.query(
      `SELECT 
        id,
        usuario_nombre,
        accion,
        modulo,
        fecha,
        DATE_FORMAT(fecha, '%d/%m/%Y - %H:%i') as fecha_formateada
      FROM bitacora 
      WHERE registro_id = ? 
      ORDER BY fecha DESC 
      LIMIT 50`,
      [id]
    );
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;