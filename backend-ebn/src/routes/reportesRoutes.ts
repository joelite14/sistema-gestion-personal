import { Router } from 'express';
import db from '../config/db';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs'; 
const XLSX = require('xlsx-style');

const router = Router();

// ============================================
// 📊 REPORTE GENERAL DE PERSONAL (PDF - DOCENTE PRIMERO)
// ============================================
router.get('/reportes/personal-pdf', async (req, res) => {
  try {
    console.log('📄 Generando reporte general de personal...');

    // Consulta con orden: Docente → Administrativo → Obrero → Vigilante → CNAE
    const [rows]: any = await db.query(`
      SELECT 
        id_personal,
        cedula,
        nombres,
        apellidos,
        cargo,
        estatus,
        CASE 
          WHEN cargo LIKE '%Docente%' THEN 'Docente'
          WHEN cargo LIKE '%Administrativo%' THEN 'Administrativo'
          WHEN cargo LIKE '%Obrero%' THEN 'Obrero'
          WHEN cargo LIKE '%Vigilante%' THEN 'Vigilante'
          WHEN cargo LIKE '%CNAE%' OR cargo LIKE '%Cocinero%' THEN 'CNAE'
          ELSE 'Otro'
        END as tipo_personal
      FROM personal 
      WHERE estatus = 'Activo'
      ORDER BY 
        CASE 
          WHEN cargo LIKE '%Docente%' THEN 1      -- Docente primero
          WHEN cargo LIKE '%Administrativo%' THEN 2  -- Administrativo segundo
          WHEN cargo LIKE '%Obrero%' THEN 3
          WHEN cargo LIKE '%Vigilante%' THEN 4
          WHEN cargo LIKE '%CNAE%' OR cargo LIKE '%Cocinero%' THEN 5
          ELSE 6
        END ASC,
        CAST(cedula AS UNSIGNED) ASC
    `);

    console.log(`✅ ${rows.length} empleados activos encontrados`);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay personal activo registrado' });
    }

    // Agrupar por tipo de personal
    const grupos: { [key: string]: any[] } = {};
    rows.forEach((emp: any) => {
      const tipo = emp.tipo_personal || 'Otro';
      if (!grupos[tipo]) {
        grupos[tipo] = [];
      }
      grupos[tipo].push(emp);
    });

    // 🔥 ORDEN: Docente primero, luego Administrativo
    const ordenGrupos = ['Docente', 'Administrativo', 'Obrero', 'Vigilante', 'CNAE', 'Otro'];

    // Crear documento PDF
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      bufferPages: true
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=personal_ebn.pdf');
    doc.pipe(res);

    // ============================================
    // FUNCIÓN PARA AGREGAR MEMBRETE
    // ============================================
    function agregarMembrete() {
      // Buscar logo en uploads
      const uploadDir = path.join(__dirname, '../../uploads');
      let logoPath = '';

      try {
        if (fs.existsSync(uploadDir)) {
          const files = fs.readdirSync(uploadDir);
          const logoFile = files.find(f => f.toLowerCase().startsWith('logo'));
          if (logoFile) {
            logoPath = path.join(uploadDir, logoFile);
          }
        }
      } catch (error) {
        console.log('⚠️ Error al buscar logo:', error);
      }

      // Logo
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 40, { width: 70 });
        } catch (error) {
          console.log('⚠️ No se pudo cargar el logo');
        }
      }

      // Membrete
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('Republica Bolivariana de Venezuela', { align: 'center' })
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Ministerio del Poder Popular para la Educacion', { align: 'center' })
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('E.B.N. "Dr. Vicente Peña"', { align: 'center' })
         .fontSize(10)
         .font('Helvetica')
         .text('San Juan de los Morros, Estado Guarico', { align: 'center' })
         .moveDown(0.5);

      // Línea decorativa
      doc.strokeColor('#1a3a5c')
         .lineWidth(2)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown(0.5);

      // Título del reporte
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1a5276')
         .text('REPORTE GENERAL DE PERSONAL', { align: 'center' })
         .fontSize(9)
         .font('Helvetica')
         .fillColor('#666666')
         .text('Fecha de generacion: ' + new Date().toLocaleString('es-VE', { 
           day: '2-digit', 
           month: '2-digit', 
           year: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         }), { align: 'center' })
         .moveDown(0.5);

      // Línea separadora
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown(0.5);
    }

    // ============================================
    // FUNCIÓN PARA AGREGAR TABLA DE EMPLEADOS
    // ============================================
    function agregarTablaEmpleados(titulo: string, empleados: any[], colorFondo: string = '#2c7be5') {
      // Título de la sección
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a3a5c')
         .text(titulo + ' (' + empleados.length + ' empleados)', 50, doc.y)
         .moveDown(0.5);

      // Verificar espacio
      if (doc.y > 700) {
        doc.addPage();
      }

      const startX = 50;
      let currentY = doc.y;
      
      // Anchos de columnas
      const col1 = 35;   // N°
      const col2 = 75;   // Cédula
      const col3 = 115;  // Nombres
      const col4 = 115;  // Apellidos
      const col5 = 95;   // Cargo
      const col6 = 65;   // Estatus
      
      const totalWidth = col1 + col2 + col3 + col4 + col5 + col6;

      // Fondo del encabezado
      doc.rect(startX, currentY, totalWidth, 20)
         .fillColor(colorFondo)
         .fill();

      // Texto de encabezados
      doc.font('Helvetica-Bold')
         .fontSize(9)
         .fillColor('#ffffff');

      let xPos = startX;
      
      doc.text('N°', xPos + 4, currentY + 4, { width: col1 - 8, align: 'center' });
      xPos += col1;
      doc.text('Cedula', xPos + 4, currentY + 4, { width: col2 - 8, align: 'center' });
      xPos += col2;
      doc.text('Nombres', xPos + 4, currentY + 4, { width: col3 - 8, align: 'left' });
      xPos += col3;
      doc.text('Apellidos', xPos + 4, currentY + 4, { width: col4 - 8, align: 'left' });
      xPos += col4;
      doc.text('Cargo', xPos + 4, currentY + 4, { width: col5 - 8, align: 'left' });
      xPos += col5;
      doc.text('Estatus', xPos + 4, currentY + 4, { width: col6 - 8, align: 'left' });

      currentY += 20;

      // Dibujar filas
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#333333');

      let rowNum = 1;

      empleados.forEach((emp, index) => {
        // Verificar espacio
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;

          // Re-dibujar encabezados
          doc.rect(startX, currentY, totalWidth, 20)
             .fillColor(colorFondo)
             .fill()
             .fillColor('#ffffff');

          doc.font('Helvetica-Bold').fontSize(9);
          
          xPos = startX;
          doc.text('N°', xPos + 4, currentY + 4, { width: col1 - 8, align: 'center' });
          xPos += col1;
          doc.text('Cedula', xPos + 4, currentY + 4, { width: col2 - 8, align: 'center' });
          xPos += col2;
          doc.text('Nombres', xPos + 4, currentY + 4, { width: col3 - 8, align: 'left' });
          xPos += col3;
          doc.text('Apellidos', xPos + 4, currentY + 4, { width: col4 - 8, align: 'left' });
          xPos += col4;
          doc.text('Cargo', xPos + 4, currentY + 4, { width: col5 - 8, align: 'left' });
          xPos += col5;
          doc.text('Estatus', xPos + 4, currentY + 4, { width: col6 - 8, align: 'left' });
          
          currentY += 20;
          doc.font('Helvetica').fontSize(8).fillColor('#333333');
        }

        // Color alternativo para filas
        if (index % 2 === 0) {
          doc.rect(startX, currentY, totalWidth, 16)
             .fillColor('#f8f9fa')
             .fill();
        }

        // Datos de la fila
        const cedulaFormateada = emp.cedula ? emp.cedula.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '-';
        const estatus = emp.estatus || 'Activo';

        xPos = startX;
        
        doc.fillColor('#333333')
           .text(rowNum.toString(), xPos + 4, currentY + 3, { width: col1 - 8, align: 'center' });
        xPos += col1;
        doc.text(cedulaFormateada, xPos + 4, currentY + 3, { width: col2 - 8, align: 'center' });
        xPos += col2;
        doc.text((emp.nombres || '').substring(0, 25), xPos + 4, currentY + 3, { width: col3 - 8, align: 'left' });
        xPos += col3;
        doc.text((emp.apellidos || '').substring(0, 25), xPos + 4, currentY + 3, { width: col4 - 8, align: 'left' });
        xPos += col4;
        doc.text((emp.cargo || '').substring(0, 20), xPos + 4, currentY + 3, { width: col5 - 8, align: 'left' });
        xPos += col5;
        doc.text(estatus, xPos + 4, currentY + 3, { width: col6 - 8, align: 'left' });

        currentY += 16;
        rowNum++;
      });

      // Línea de total del grupo
      doc.rect(startX, currentY, totalWidth, 18)
         .fillColor('#e8f4fd')
         .fill()
         .fillColor('#1a5276')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Total ' + titulo + ': ' + empleados.length + ' empleados', startX + 5, currentY + 4, {
           width: totalWidth - 10,
           align: 'right'
         });

      currentY += 22;
      doc.moveDown(0.5);
    }

    // ============================================
    // GENERAR EL REPORTE
    // ============================================
    agregarMembrete();

    let totalGeneral = 0;

    // Colores por tipo de personal
    const colores: { [key: string]: string } = {
      'Docente': '#27ae60',        // Verde
      'Administrativo': '#2c7be5', // Azul
      'Obrero': '#f39c12',         // Naranja
      'Vigilante': '#8e44ad',      // Morado
      'CNAE': '#e74c3c',           // Rojo
      'Otro': '#95a5a6'            // Gris
    };

    ordenGrupos.forEach(tipo => {
      if (grupos[tipo] && grupos[tipo].length > 0) {
        const color = colores[tipo] || '#2c3e50';
        agregarTablaEmpleados(tipo, grupos[tipo], color);
        totalGeneral += grupos[tipo].length;
      }
    });

    // ============================================
    // PÁGINA DE RESUMEN FINAL
    // ============================================
    doc.addPage();

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1a5276')
       .text('RESUMEN GENERAL', { align: 'center' })
       .moveDown(1);

    // Tabla de resumen
    const summaryY = doc.y;
    doc.rect(50, summaryY, 500, 30 + (Object.keys(grupos).length * 22))
       .fillColor('#f8f9fa')
       .fill()
       .strokeColor('#1a3a5c')
       .lineWidth(1)
       .stroke();

    let yPos = summaryY + 8;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#1a3a5c')
       .text('TIPO DE PERSONAL', 65, yPos, { width: 200 });
    doc.text('CANTIDAD', 400, yPos, { width: 100, align: 'right' });
    yPos += 22;

    ordenGrupos.forEach(tipo => {
      if (grupos[tipo] && grupos[tipo].length > 0) {
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#333333')
           .text(tipo, 65, yPos, { width: 200 });
        doc.text(grupos[tipo].length.toString(), 400, yPos, { width: 100, align: 'right' });
        yPos += 20;
      }
    });

    // Total general
    yPos += 5;
    doc.rect(50, yPos - 3, 500, 22)
       .fillColor('#1a5276')
       .fill()
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('TOTAL GENERAL', 65, yPos + 2, { width: 200 });
    doc.text(totalGeneral.toString(), 400, yPos + 2, { width: 100, align: 'right' });

    // ============================================
    // PIE DE PÁGINA CON NÚMEROS
    // ============================================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Pagina ' + (i + 1) + ' de ' + pages.count, 50, 750, { align: 'center' })
         .text('Sistema de Gestion de Personal - E.B.N. Dr. Vicente Peña', 50, 760, { align: 'center' });
    }

    doc.end();
    console.log('✅ Reporte general de personal generado exitosamente');

  } catch (error) {
    console.error('❌ Error al generar reporte general de personal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar el reporte', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});
// ============================================
// 📄 EXPEDIENTE INDIVIDUAL DE EMPLEADO (PDF)
// ============================================
router.get('/reportes/expediente-pdf/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [empleadoRows]: any = await db.query('SELECT * FROM personal WHERE id_personal = ?', [id]);
    const [documentosRows]: any = await db.query('SELECT * FROM documentos WHERE personal_id = ?', [id]);
    
    if (empleadoRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }
    
    const emp = empleadoRows[0];
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=expediente_${emp.cedula}.pdf`);
    
    doc.pipe(res);
    
    // Título
    doc.fontSize(20).font('Helvetica-Bold')
      .text('E.B.N. Dr. Vicente Peña', { align: 'center' });
    doc.fontSize(16)
      .text('Expediente del Empleado', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10)
      .text(`Generado: ${new Date().toLocaleString('es-VE')}`, { align: 'right' });
    doc.moveDown(2);
    
    // Datos del empleado
    doc.fontSize(14).font('Helvetica-Bold').text('Datos Personales');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${emp.nombres} ${emp.apellidos}`);
    doc.text(`Cédula: ${emp.cedula}`);
    doc.text(`Teléfono: ${emp.telefono || 'No registrado'}`);
    doc.text(`Correo: ${emp.correo || 'No registrado'}`);
    doc.moveDown();
    
    // Información laboral
    doc.fontSize(14).font('Helvetica-Bold').text('Información Laboral');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Cargo: ${emp.cargo || '-'}`);
    doc.text(`Cod. Cargo: ${emp.cod_cargo || 'No asignado'}`);
    doc.text(`Nivel Académico: ${emp.nivel_academico || '-'}`);
    doc.text(`Dependencia: ${emp.dependencia || '-'}`);
    doc.text(`Fecha de Ingreso: ${emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString('es-VE') : '-'}`);
    doc.text(`Estatus: ${emp.estatus || '-'}`);
    doc.moveDown();
    
    // Documentos
    doc.fontSize(14).font('Helvetica-Bold').text('Documentos del Expediente');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    if (documentosRows.length === 0) {
      doc.text('No hay documentos registrados');
    } else {
      for (const docItem of documentosRows) {
        doc.text(`• ${docItem.tipo_documento} - Subido el ${new Date(docItem.fecha_subida).toLocaleDateString('es-VE')}`);
      }
    }
    
    doc.moveDown(2);
    doc.fontSize(8).text('Documento generado por el Sistema de Expedientes E.B.N. Dr. Vicente Peña', { align: 'center' });
    
    doc.end();
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ success: false, message: 'Error al generar PDF' });
  }
});

// ============================================
// 📄 CONSTANCIA DE TRABAJO (CON MEMBRETE OFICIAL + LOGO)
// ============================================
router.get('/reportes/constancia-pdf/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows]: any = await db.query(`
      SELECT 
        id_personal, cedula, nombres, apellidos, telefono, correo,
        fecha_nacimiento, edad, cargo, cod_cargo, nivel_academico,
        dependencia, fecha_ingreso, estatus, foto_url,
        en_reposo, en_permiso, genero, estado_civil, direccion,
        turno, dependencia_actual, dependencia_voucher
      FROM personal 
      WHERE id_personal = ?
    `, [id]);
    
    console.log('📊 Total de empleados:', rows.length);
    console.log('📊 Primer empleado:', rows[0]);
    console.log('🕒 Turno del primero:', rows[0]?.turno);
    console.log('🏢 Dependencia Actual del primero:', rows[0]?.dependencia_actual);
    console.log('📄 Dependencia Voucher del primero:', rows[0]?.dependencia_voucher);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    const empleado = rows[0];

    // Determinar género
    const genero = empleado.genero || 'Masculino';
    const esFemenino = genero.toLowerCase() === 'femenino';
    const ciudadano = esFemenino ? 'ciudadana' : 'ciudadano';
    const venezolano = esFemenino ? 'venezolana' : 'venezolano';

    // Fechas
    const fechaIngreso = empleado.fecha_ingreso 
      ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-VE', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        })
      : 'fecha no registrada';

    const fechaEmision = new Date().toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const cargoTexto = empleado.cod_cargo 
      ? `${empleado.cargo} código: ${empleado.cod_cargo}`
      : empleado.cargo;

    // Crear el PDF
    const doc = new PDFDocument({
      size: 'Letter',
      margin: 60,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Constancia_Trabajo_${empleado.cedula}.pdf`);

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;

    // ============ LOGO (POSICIÓN FIJA, SIN MOVER TEXTO) ============
    const uploadDir = path.join(__dirname, '../../uploads');

    try {
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        const logoFile = files.find(f => f.toLowerCase().startsWith('logo'));
        
        if (logoFile) {
          const logoPath = path.join(uploadDir, logoFile);
          console.log('✅ Logo encontrado:', logoFile);
          
          doc.image(logoPath, margin + 10, margin + 15, {
            fit: [85, 85]
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Error al cargar logo:', error);
    }
    
    // ============ MARCO DECORATIVO ============
    doc
      .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
      .lineWidth(1)
      .stroke('#1a3a5c');

    // ============ MEMBRETE OFICIAL ============
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('República Bolivariana de Venezuela', {
        align: 'center',
        lineGap: 2
      })
      .moveDown(0.1);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Ministerio del Poder Popular para la Educación', {
        align: 'center',
        lineGap: 2
      })
      .moveDown(0.1);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Escuela Básica Nacional "Dr. Vicente Peña"', {
        align: 'center',
        lineGap: 2
      })
      .moveDown(0.1);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('San Juan de los Morros', {
        align: 'center',
        lineGap: 2
      })
      .text('Estado Guárico', {
        align: 'center',
        lineGap: 2
      })
      .moveDown(2);

    // ============ TÍTULO ============
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('CONSTANCIA DE TRABAJO', {
        align: 'center',
        lineGap: 2
      })
      .moveDown(1.5);

    // ============ TEXTO COMPLETO ============
    const textoCompleto = 
      `Quien suscribe, Profa. María Victoria Mejías C.I. V-: 14.870.662 Directora de la Escuela Básica Nacional "Dr. Vicente Peña", ubicada en San Juan de los Morros, Avenida Bolívar Nº 88, teléfono (0246) 4156266, Código Nº 006563355, hace constar que el/la ${ciudadano}: ${empleado.nombres} ${empleado.apellidos} quien es ${venezolano}, mayor de edad y titular de la cédula de identidad Nº. ${empleado.cedula}, cumple funciones en esta institución como: ${empleado.cargo} - ${empleado.nivel_academico}, código: ${empleado.cod_cargo} desde el ${fechaIngreso} hasta la presente fecha.`;

    const anchoTexto = pageWidth - (margin * 2) - 40;

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000000')
      .text(textoCompleto, {
        align: 'justify',
        lineGap: 3,
        width: anchoTexto,
        indent: 20,
      })
      .moveDown(1.5);

    // ============ PIE DE PÁGINA ============
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000000')
      .text(
        `Constancia que se expide a petición de la parte interesada, en la ciudad de San Juan de los Morros, a los ${fechaEmision}.`,
        {
          align: 'justify',
          lineGap: 3,
          width: anchoTexto,
          indent: 20,
        }
      )
      .moveDown(8);

    // ============ FIRMA ============
    const firmaY = doc.y;
    const firmaX = pageWidth / 2 - 100;

    doc
      .moveTo(firmaX, firmaY)
      .lineTo(firmaX + 200, firmaY)
      .lineWidth(1)
      .stroke('#000000')
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Profa. María Victoria Mejías', {
        align: 'center',
        lineGap: 0
      })
      .font('Helvetica')
      .fillColor('#000000')
      .text('C.I. V-: 14.870.662', {
        align: 'center',
        lineGap: 0
      })
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Directora', {
        align: 'center',
        lineGap: 0,
      });
    
    // ============ PIE DE PÁGINA INFERIOR ============
    doc
      .moveDown(10)
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text(
        'Documento generado por el Sistema de Expedientes E.B.N. Dr. Vicente Peña',
        margin,
        doc.y + 20,
        { align: 'center', width: pageWidth - margin * 2 }
      );

    doc.end();

  } catch (error) {
    console.error('Error al generar constancia:', error);
    res.status(500).json({ success: false, message: 'Error al generar constancia' });
  }
});

/// ============================================
// 📊 RAC - REGISTRO AUXILIAR DE PERSONAL (EXCEL CON COLORES)
// ============================================
router.get('/reportes/rac-excel', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        cedula, 
        nombres, 
        apellidos, 
        telefono, 
        correo,
        cargo, 
        turno,
        nivel_academico, 
        cod_cargo,
        dependencia_actual, 
        dependencia_voucher,
        DATE_FORMAT(fecha_ingreso, '%d/%m/%Y') as fecha_ingreso,
        estatus,
        CASE 
          WHEN cargo LIKE '%Docente%' THEN 'Docente'
          WHEN cargo LIKE '%Administrativo%' THEN 'Administrativo'
          WHEN cargo LIKE '%Obrero%' THEN 'Obrero'
          WHEN cargo LIKE '%Vigilante%' THEN 'Vigilante'
          WHEN cargo LIKE '%CNAE%' OR cargo LIKE '%Cocinero%' THEN 'CNAE'
          ELSE 'Otro'
        END as tipo_personal
      FROM personal 
      ORDER BY 
        CASE 
          WHEN cargo LIKE '%Docente%' THEN 1
          WHEN cargo LIKE '%Administrativo%' THEN 2
          WHEN cargo LIKE '%Obrero%' THEN 3
          WHEN cargo LIKE '%Vigilante%' THEN 4
          WHEN cargo LIKE '%CNAE%' OR cargo LIKE '%Cocinero%' THEN 5
          ELSE 6
        END ASC, 
        CAST(cedula AS UNSIGNED) ASC
    `);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay empleados registrados' });
    }

    // ============================================
    // CALCULAR TOTALES POR TIPO Y TURNO
    // ============================================
    const tipos = ['Docente', 'Administrativo', 'Obrero', 'Vigilante', 'CNAE'];
    const totalesPorTipoYTurno: any = {};

    // Inicializar estructura
    tipos.forEach((tipo) => {
      totalesPorTipoYTurno[tipo] = {
        Mañana: 0,
        Tarde: 0,
        Ambos: 0,
        Total: 0
      };
    });

    // Contar empleados por tipo y turno
    rows.forEach((row: any) => {
      const tipo = row.tipo_personal || 'Otro';
      const turno = (row.turno || '').trim();

      if (totalesPorTipoYTurno[tipo]) {
        // 🔥 REGLA ESPECIAL: CNAE solo en "Ambos"
        if (tipo === 'CNAE') {
          totalesPorTipoYTurno[tipo].Ambos++;
          totalesPorTipoYTurno[tipo].Total++;
        } else {
          if (turno === 'Mañana') {
            totalesPorTipoYTurno[tipo].Mañana++;
          } else if (turno === 'Tarde') {
            totalesPorTipoYTurno[tipo].Tarde++;
          } else if (turno === 'Ambos') {
            totalesPorTipoYTurno[tipo].Ambos++;
          }
          totalesPorTipoYTurno[tipo].Total++;
        }
      }
    });

    // Totales generales por turno
    let totalMañana = 0;
    let totalTarde = 0;
    let totalAmbos = 0;
    let totalGeneral = rows.length;

    tipos.forEach((tipo) => {
      totalMañana += totalesPorTipoYTurno[tipo].Mañana;
      totalTarde += totalesPorTipoYTurno[tipo].Tarde;
      totalAmbos += totalesPorTipoYTurno[tipo].Ambos;
    });

    // ============================================
    // CREAR WORKBOOK CON EXCELJS
    // ============================================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RAC');

    // ============================================
    // DEFINIR COLUMNAS
    // ============================================
    worksheet.columns = [
      { header: '#', key: 'numero', width: 6 },
      { header: 'Cédula', key: 'cedula', width: 12 },
      { header: 'Nombres', key: 'nombres', width: 22 },
      { header: 'Apellidos', key: 'apellidos', width: 22 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Correo', key: 'correo', width: 30 },
      { header: 'Turno', key: 'turno', width: 12 },
      { header: 'Cargo', key: 'cargo', width: 18 },
      { header: 'Nivel Académico', key: 'nivel', width: 20 },
      { header: 'Código', key: 'codigo', width: 14 },
      { header: 'Dependencia Actual', key: 'dep_actual', width: 35 },
      { header: 'Dependencia Voucher', key: 'dep_voucher', width: 35 },
      { header: 'Fecha Ingreso', key: 'fecha_ingreso', width: 14 },
      { header: 'Estatus', key: 'estatus', width: 12 },
    ];

    // ============================================
    // CONGELAR LA PRIMERA FILA (ENCABEZADOS)
    // ============================================
    worksheet.views = [
      { state: 'frozen', ySplit: 1 }
    ];

    // ============================================
    // AGREGAR DATOS
    // ============================================
    rows.forEach((emp: any, index: number) => {
      worksheet.addRow({
        numero: index + 1,
        cedula: emp.cedula || '',
        nombres: emp.nombres || '',
        apellidos: emp.apellidos || '',
        telefono: emp.telefono || '',
        correo: emp.correo || '',
        turno: emp.turno || '',
        cargo: emp.cargo || '',
        nivel: emp.nivel_academico || '',
        codigo: emp.cod_cargo || '',
        dep_actual: emp.dependencia_actual || '',
        dep_voucher: emp.dependencia_voucher || '',
        fecha_ingreso: emp.fecha_ingreso || '',
        estatus: emp.estatus || ''
      });
    });

    // ============================================
    // ESTILOS - ENCABEZADOS (Fila 1)
    // ============================================
    const headerRow = worksheet.getRow(1);
    headerRow.font = { 
      bold: true, 
      color: { argb: 'FFFFFFFF' }
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a3a5c' }
    };
    headerRow.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1a3a5c' } },
        bottom: { style: 'medium', color: { argb: 'FF1a3a5c' } },
        left: { style: 'medium', color: { argb: 'FF1a3a5c' } },
        right: { style: 'medium', color: { argb: 'FF1a3a5c' } }
      };
    });

    // ============================================
    // ESTILOS - DATOS
    // ============================================
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        
        if (cell.col === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // ============================================
    // ACTIVAR FILTROS
    // ============================================
    worksheet.autoFilter = {
      from: 'A1',
      to: `N${rows.length + 1}`
    };

    // ============================================
    // AGREGAR CUADRO DE TOTALES POR TURNO AL FINAL
    // ============================================
    let rowIndex = worksheet.rowCount + 1;
    rowIndex = rowIndex + 2;

    // Título del cuadro
    const tituloRow = worksheet.getRow(rowIndex);
    tituloRow.getCell(1).value = '📊 RESUMEN DE TOTALES POR TURNO';
    tituloRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    tituloRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a3a5c' }
    };
    worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    rowIndex++;

    // Cabecera de la tabla de totales
    const headerTotalRow = worksheet.getRow(rowIndex);

    // 🔥 Tipo de Personal ocupa 2 columnas (A y B combinadas)
    headerTotalRow.getCell(1).value = 'Tipo de Personal';
    headerTotalRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerTotalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6B3A' }
    };
    headerTotalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    headerTotalRow.getCell(1).border = {
      top: { style: 'medium', color: { argb: 'FF6B3A' } },
      bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
      left: { style: 'medium', color: { argb: 'FF6B3A' } },
      right: { style: 'medium', color: { argb: 'FF6B3A' } }
    };
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);

    // Las demás columnas (C, D, E, F) para los turnos y total
    const turnosHeaders = ['Mañana', 'Tarde', 'Ambos', 'Total General'];
    turnosHeaders.forEach((header, index) => {
      const col = index + 3; // C, D, E, F
      headerTotalRow.getCell(col).value = header;
      headerTotalRow.getCell(col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerTotalRow.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B3A' }
      };
      headerTotalRow.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      headerTotalRow.getCell(col).border = {
        top: { style: 'medium', color: { argb: 'FF6B3A' } },
        bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
        left: { style: 'medium', color: { argb: 'FF6B3A' } },
        right: { style: 'medium', color: { argb: 'FF6B3A' } }
      };
    });

    rowIndex++;

    // Datos de la tabla por tipo
    tipos.forEach((tipo) => {
      const row = worksheet.getRow(rowIndex);
      const data = totalesPorTipoYTurno[tipo] || { Mañana: 0, Tarde: 0, Ambos: 0, Total: 0 };
      
      // Tipo en columna A (combinada con B)
      row.getCell(1).value = tipo;
      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(1).border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
      worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);

      // Datos en columnas C, D, E, F
      row.getCell(3).value = data.Mañana || 0;
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
      
      row.getCell(4).value = data.Tarde || 0;
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
      
      row.getCell(5).value = data.Ambos || 0;
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
      
      row.getCell(6).value = data.Total || 0;
      row.getCell(6).font = { bold: true, color: { argb: 'FF1a3a5c' } };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
      
      rowIndex++;
    });

    // Fila de TOTALES GENERALES
    const totalRow = worksheet.getRow(rowIndex);

    // TOTAL en columna A (combinada con B)
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(1).font = { bold: true, size: 12 };
    totalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(1).border = {
      top: { style: 'medium', color: { argb: 'FF6B3A' } },
      bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
      left: { style: 'medium', color: { argb: 'FF6B3A' } },
      right: { style: 'medium', color: { argb: 'FF6B3A' } }
    };
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);

    // Totales en columnas C, D, E, F
    totalRow.getCell(3).value = totalMañana;
    totalRow.getCell(3).font = { bold: true };
    totalRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };
    totalRow.getCell(3).border = {
      top: { style: 'medium', color: { argb: 'FF6B3A' } },
      bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
      left: { style: 'medium', color: { argb: 'FF6B3A' } },
      right: { style: 'medium', color: { argb: 'FF6B3A' } }
    };

    totalRow.getCell(4).value = totalTarde;
    totalRow.getCell(4).font = { bold: true };
    totalRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };
    totalRow.getCell(4).border = {
      top: { style: 'medium', color: { argb: 'FF6B3A' } },
      bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
      left: { style: 'medium', color: { argb: 'FF6B3A' } },
      right: { style: 'medium', color: { argb: 'FF6B3A' } }
    };

    totalRow.getCell(5).value = totalAmbos;
    totalRow.getCell(5).font = { bold: true };
    totalRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(5).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };
    totalRow.getCell(5).border = {
      top: { style: 'medium', color: { argb: 'FF6B3A' } },
      bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
      left: { style: 'medium', color: { argb: 'FF6B3A' } },
      right: { style: 'medium', color: { argb: 'FF6B3A' } }
    };

    totalRow.getCell(6).value = totalGeneral;
    totalRow.getCell(6).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    totalRow.getCell(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6B3A' }
    };
    totalRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(6).border = {
      top: { style: 'medium', color: { argb: 'FF6B3A' } },
      bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
      left: { style: 'medium', color: { argb: 'FF6B3A' } },
      right: { style: 'medium', color: { argb: 'FF6B3A' } }
    };

    // ============================================
    // GENERAR ARCHIVO
    // ============================================
    const buffer = await workbook.xlsx.writeBuffer();
    
    const timestamp = new Date().getTime();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=RAC_Personal_${timestamp}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error al generar RAC Excel:', error);
    res.status(500).json({ success: false, message: 'Error al generar RAC Excel' });
  }
});

// ============================================
// 📊 REPORTE DE PERSONAL POR DEPENDENCIA VOUCHER (CON TOTALES AL FINAL)
// ============================================
router.get('/reportes/personal-por-dependencia', async (req, res) => {
  try {
    const { dependencia } = req.query;

    let query = `
      SELECT 
        p.cedula,
        p.nombres,
        p.apellidos,
        p.cargo,
        p.turno,
        p.estatus,
        p.dependencia_voucher,
        CASE 
          WHEN p.dependencia_voucher IS NULL OR p.dependencia_voucher = '' THEN 'SIN ASIGNAR'
          ELSE p.dependencia_voucher
        END as voucher_clean,
        CASE 
          WHEN p.cargo LIKE '%Docente%' THEN 'Docente'
          WHEN p.cargo LIKE '%Administrativo%' THEN 'Administrativo'
          WHEN p.cargo LIKE '%Obrero%' THEN 'Obrero'
          WHEN p.cargo LIKE '%Vigilante%' THEN 'Vigilante'
          WHEN p.cargo LIKE '%CNAE%' OR p.cargo LIKE '%Cocinero%' THEN 'CNAE'
          ELSE 'Otro'
        END as tipo_personal
      FROM personal p
    `;

    const params = [];

    if (dependencia && dependencia !== 'todas') {
      query += ` WHERE p.dependencia_voucher = ?`;
      params.push(dependencia);
    }

    // ORDER: Dependencia → Cédula (numérico)
    query += `ORDER BY 
  voucher_clean ASC,
  CASE 
    WHEN tipo_personal = 'Docente' THEN 1
    WHEN tipo_personal = 'Administrativo' THEN 2
    WHEN tipo_personal = 'Obrero' THEN 3
    WHEN tipo_personal = 'Vigilante' THEN 4
    WHEN tipo_personal = 'CNAE' THEN 5
    ELSE 6
  END ASC,
  CAST(p.cedula AS UNSIGNED) ASC`;

    const [rows]: any = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay empleados en esta dependencia' });
    }

    // ============================================
    // CALCULAR TOTALES POR TIPO
    // ============================================
    const totales: any = {
      Docente: 0,
      Administrativo: 0,
      Obrero: 0,
      Vigilante: 0,
      CNAE: 0,
      Otro: 0
    };

    rows.forEach((emp: any) => {
      const tipo = emp.tipo_personal || 'Otro';
      if (totales[tipo] !== undefined) {
        totales[tipo]++;
      } else {
        totales.Otro++;
      }
    });

    const totalGeneral = rows.length;

    // ============================================
    // CREAR EXCEL CON EXCELJS
    // ============================================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Personal por Dependencia');

    // ============================================
    // CONFIGURAR COLUMNAS
    // ============================================
    worksheet.columns = [
      { header: 'Dependencia Voucher', key: 'voucher', width: 35 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Cédula', key: 'cedula', width: 12 },
      { header: 'Nombres', key: 'nombres', width: 22 },
      { header: 'Apellidos', key: 'apellidos', width: 22 },
      { header: 'Cargo', key: 'cargo', width: 18 },
      { header: 'Turno', key: 'turno', width: 12 },
      { header: 'Estatus', key: 'estatus', width: 12 },
    ];

    // ============================================
    // AGREGAR DATOS AGRUPADOS POR DEPENDENCIA
    // ============================================
    let rowIndex = 2;
    let currentVoucher = '';

    rows.forEach((emp: any) => {
      const voucher = emp.voucher_clean || 'SIN ASIGNAR';

      // Si cambia de Voucher, mostrar el título
      if (voucher !== currentVoucher) {
        if (currentVoucher !== '') {
          // Espacio entre dependencias
          rowIndex++;
        }

        const titleRow = worksheet.getRow(rowIndex);
        titleRow.getCell(1).value = `📌 ${voucher}`;
        titleRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        titleRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1a3a5c' }
        };
        worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
        rowIndex++;
        currentVoucher = voucher;
      }

      // Datos del empleado
      const dataRow = worksheet.getRow(rowIndex);
      dataRow.getCell(1).value = voucher;
      dataRow.getCell(2).value = emp.tipo_personal || 'Otro';
      dataRow.getCell(3).value = emp.cedula || '';
      dataRow.getCell(4).value = emp.nombres || '';
      dataRow.getCell(5).value = emp.apellidos || '';
      dataRow.getCell(6).value = emp.cargo || '';
      dataRow.getCell(7).value = emp.turno || '';
      dataRow.getCell(8).value = emp.estatus || '';
      rowIndex++;
    });

    // ============================================
    // AGREGAR TOTALES AL FINAL
    // ============================================
    // Espacio antes de los totales
    rowIndex++;
    rowIndex++;

    // Línea separadora
    const separatorRow = worksheet.getRow(rowIndex);
    separatorRow.getCell(1).value = '═══════════════════════════════════════════════════════════════════';
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
    rowIndex++;

    // Título de totales
    const totalTitleRow = worksheet.getRow(rowIndex);
    totalTitleRow.getCell(1).value = '📊 TOTALES GENERALES';
    totalTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    totalTitleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a3a5c' }
    };
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
    rowIndex++;

    // Totales por tipo
    const tipos = ['Docente', 'Administrativo', 'Obrero', 'Vigilante', 'CNAE', 'Otro'];
    tipos.forEach((tipo) => {
      const count = totales[tipo] || 0;
      if (count > 0 || tipo === 'Otro') {
        const row = worksheet.getRow(rowIndex);
        row.getCell(1).value = `${tipo}: ${count}`;
        row.getCell(1).font = { bold: true };
        worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
        rowIndex++;
      }
    });

    // Línea separadora
    rowIndex++;
    const totalRow = worksheet.getRow(rowIndex);
    totalRow.getCell(1).value = `TOTAL EMPLEADOS: ${totalGeneral}`;
    totalRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    totalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6B3A' }
    };
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);

    // ============================================
    // GENERAR ARCHIVO
    // ============================================
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().getTime();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Personal_por_Voucher_${timestamp}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error al generar reporte por dependencia:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte' });
  }
});

// ============================================
// 📊 REPORTE DE REPOSOS Y PERMISOS POR FECHAS (EXCEL)
// ============================================
router.get('/reportes/reposos-permisos', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo } = req.query;

    let query = `
      SELECT 
        pr.id,
        pr.personal_id,
        pr.tipo,
        pr.fecha_inicio,
        pr.fecha_fin,
        pr.motivo,
        pr.estatus,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.cargo,
        DATEDIFF(pr.fecha_fin, pr.fecha_inicio) + 1 as dias
      FROM permisos_reposos pr
      INNER JOIN personal p ON pr.personal_id = p.id_personal
      WHERE 1=1
    `;

    const params = [];

    if (fecha_desde && fecha_hasta) {
      query += ` AND pr.fecha_inicio >= ? AND pr.fecha_inicio <= ?`;
      params.push(fecha_desde, fecha_hasta);
    } else if (fecha_desde) {
      query += ` AND pr.fecha_inicio >= ?`;
      params.push(fecha_desde);
    } else if (fecha_hasta) {
      query += ` AND pr.fecha_inicio <= ?`;
      params.push(fecha_hasta);
    }

    if (tipo && tipo !== 'todos') {
      query += ` AND pr.tipo LIKE ?`;
      params.push(`%${tipo}%`);
    }

    query += ` ORDER BY pr.fecha_inicio DESC, pr.fecha_fin DESC`;

    const [rows]: any = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay registros en el rango de fechas seleccionado' });
    }

    // ============================================
    // CALCULAR TOTALES
    // ============================================
    const totalReposos = rows.filter((r: any) => r.tipo && r.tipo.includes('Reposo')).length;
    const totalPermisos = rows.filter((r: any) => r.tipo && r.tipo.includes('Permiso')).length;
    const totalActivos = rows.filter((r: any) => r.estatus === 'Activo').length;
    const totalFinalizados = rows.filter((r: any) => r.estatus === 'Finalizado').length;

    // ============================================
    // CREAR EXCEL CON EXCELJS
    // ============================================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reposos y Permisos');

    // ============================================
    // CONFIGURAR COLUMNAS
    // ============================================
    worksheet.columns = [
      { header: '#', key: 'numero', width: 6 },
      { header: 'Cédula', key: 'cedula', width: 12 },
      { header: 'Empleado', key: 'empleado', width: 30 },
      { header: 'Cargo', key: 'cargo', width: 18 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Fecha Inicio', key: 'fecha_inicio', width: 14 },
      { header: 'Fecha Fin', key: 'fecha_fin', width: 14 },
      { header: 'Días', key: 'dias', width: 8 },
      { header: 'Motivo', key: 'motivo', width: 30 },
      { header: 'Estatus', key: 'estatus', width: 12 },
    ];

    // ============================================
    // ESTILOS - ENCABEZADOS
    // ============================================
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B3A' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell: any) => {
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF6B3A' } },
        bottom: { style: 'medium', color: { argb: 'FF6B3A' } },
        left: { style: 'medium', color: { argb: 'FF6B3A' } },
        right: { style: 'medium', color: { argb: 'FF6B3A' } }
      };
    });

    // ============================================
    // AGREGAR DATOS
    // ============================================
    let rowIndex = 2;

    rows.forEach((emp: any, index: number) => {
      const dataRow = worksheet.getRow(rowIndex);
      
      if (index % 2 === 0) {
        dataRow.eachCell((cell: any) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
        });
      }
      
      dataRow.getCell(1).value = index + 1;
      dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(2).value = emp.cedula || '';
      dataRow.getCell(3).value = `${emp.nombres || ''} ${emp.apellidos || ''}`.trim();
      dataRow.getCell(4).value = emp.cargo || '';
      dataRow.getCell(5).value = emp.tipo || '';
      dataRow.getCell(6).value = emp.fecha_inicio ? new Date(emp.fecha_inicio).toLocaleDateString('es-VE') : '';
      dataRow.getCell(7).value = emp.fecha_fin ? new Date(emp.fecha_fin).toLocaleDateString('es-VE') : '';
      dataRow.getCell(8).value = emp.dias || 0;
      dataRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(9).value = emp.motivo || '';
      dataRow.getCell(10).value = emp.estatus || '';
      
      if (emp.estatus === 'Activo') {
        dataRow.getCell(10).font = { color: { argb: 'FF00B050' } };
        dataRow.getCell(10).value = '🟢 Activo';
      } else if (emp.estatus === 'Finalizado') {
        dataRow.getCell(10).font = { color: { argb: 'FF808080' } };
        dataRow.getCell(10).value = '✅ Finalizado';
      }
      
      dataRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });
      
      rowIndex++;
    });

    // ============================================
    // AGREGAR TOTALES AL FINAL (CON CELDAS COMBINADAS - CORREGIDO)
    // ============================================
    rowIndex = rowIndex + 2;

    // Título
    const totalTitleRow = worksheet.getRow(rowIndex);
    totalTitleRow.getCell(1).value = '📊 RESUMEN DEL PERIODO';
    totalTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    totalTitleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a3a5c' }
    };
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    rowIndex++;

    // ✅ Total Reposos (TODO EN UNA SOLA CELDA)
    let row = worksheet.getRow(rowIndex);
    row.getCell(1).value = `🩺 Total Reposos: ${totalReposos}`;
    row.getCell(1).font = { bold: true };
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    rowIndex++;

    // ✅ Total Permisos
    row = worksheet.getRow(rowIndex);
    row.getCell(1).value = `📋 Total Permisos: ${totalPermisos}`;
    row.getCell(1).font = { bold: true };
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    rowIndex++;

    // ✅ Total Activos
    row = worksheet.getRow(rowIndex);
    row.getCell(1).value = `🟢 Total Activos: ${totalActivos}`;
    row.getCell(1).font = { bold: true };
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    rowIndex++;

    // ✅ Total Finalizados
    row = worksheet.getRow(rowIndex);
    row.getCell(1).value = `✅ Total Finalizados: ${totalFinalizados}`;
    row.getCell(1).font = { bold: true };
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    rowIndex++;

    // ✅ Línea separadora
    row = worksheet.getRow(rowIndex);
    row.getCell(1).value = '─────────────────────────────────';
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    rowIndex++;

    // ✅ TOTAL REGISTROS
    row = worksheet.getRow(rowIndex);
    row.getCell(1).value = `📊 TOTAL REGISTROS: ${rows.length}`;
    row.getCell(1).font = { bold: true, size: 12 };
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);

    // ============================================
    // GENERAR ARCHIVO
    // ============================================
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().getTime();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reposos_y_Permisos_${timestamp}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error al generar reporte de reposos y permisos:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte' });
  }
});

// ============================================
// 📊 REPORTE DE BITÁCORA POR FECHAS (EXCEL)
// ============================================
router.get('/reportes/bitacora', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, usuario } = req.query;

    let query = `
      SELECT 
        id,
        usuario_nombre,
        usuario_id,
        accion,
        modulo,
        registro_id,
        DATE_FORMAT(fecha, '%d/%m/%Y') as fecha_formateada,
        TIME_FORMAT(fecha, '%H:%i') as hora
      FROM bitacora
      WHERE 1=1
    `;

    const params = [];

    // Filtro por fechas
    if (fecha_desde && fecha_hasta) {
      query += ` AND DATE(fecha) >= ? AND DATE(fecha) <= ?`;
      params.push(fecha_desde, fecha_hasta);
    } else if (fecha_desde) {
      query += ` AND DATE(fecha) >= ?`;
      params.push(fecha_desde);
    } else if (fecha_hasta) {
      query += ` AND DATE(fecha) <= ?`;
      params.push(fecha_hasta);
    }

    // Filtro por usuario (opcional)
    if (usuario && usuario !== 'todos') {
      query += ` AND usuario_nombre LIKE ?`;
      params.push(`%${usuario}%`);
    }

    // Ordenar por fecha (más reciente primero)
    query += ` ORDER BY fecha DESC`;

    const [rows]: any = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay registros en el rango de fechas seleccionado' });
    }

    // ============================================
    // CALCULAR TOTALES
    // ============================================
    const totalPorModulo: any = {};
    rows.forEach((r: any) => {
      const modulo = r.modulo || 'Sin módulo';
      if (!totalPorModulo[modulo]) {
        totalPorModulo[modulo] = 0;
      }
      totalPorModulo[modulo]++;
    });

    // ============================================
    // CREAR EXCEL CON EXCELJS
    // ============================================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bitácora');

    // ============================================
    // CONFIGURAR COLUMNAS
    // ============================================
    worksheet.columns = [
      { header: '#', key: 'numero', width: 6 },
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Hora', key: 'hora', width: 10 },
      { header: 'Usuario', key: 'usuario', width: 25 },
      { header: 'Acción', key: 'accion', width: 50 },
      { header: 'Módulo', key: 'modulo', width: 20 },
    ];

    // ============================================
    // ESTILOS - ENCABEZADOS
    // ============================================
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a5c' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell: any) => {
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1a3a5c' } },
        bottom: { style: 'medium', color: { argb: 'FF1a3a5c' } },
        left: { style: 'medium', color: { argb: 'FF1a3a5c' } },
        right: { style: 'medium', color: { argb: 'FF1a3a5c' } }
      };
    });

    // ============================================
    // AGREGAR DATOS
    // ============================================
    let rowIndex = 2;

    rows.forEach((row: any, index: number) => {
      const dataRow = worksheet.getRow(rowIndex);
      
      if (index % 2 === 0) {
        dataRow.eachCell((cell: any) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
        });
      }
      
      dataRow.getCell(1).value = index + 1;
      dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(2).value = row.fecha_formateada || '';
      dataRow.getCell(3).value = row.hora || '';
      dataRow.getCell(4).value = row.usuario_nombre || 'Sistema';
      dataRow.getCell(5).value = row.accion || '';
      dataRow.getCell(6).value = row.modulo || 'Sistema';
      
      dataRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });
      
      rowIndex++;
    });

    // ============================================
    // AGREGAR TOTALES AL FINAL
    // ============================================
    rowIndex = rowIndex + 2;

    // Título
    const totalTitleRow = worksheet.getRow(rowIndex);
    totalTitleRow.getCell(1).value = '📊 RESUMEN DEL PERIODO';
    totalTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    totalTitleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a3a5c' }
    };
    worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    rowIndex++;

    // Totales por módulo
    const modulos = Object.keys(totalPorModulo);
    modulos.forEach((modulo) => {
      const row = worksheet.getRow(rowIndex);
      row.getCell(1).value = `📌 ${modulo}:`;
      row.getCell(1).font = { bold: true };
      row.getCell(2).value = totalPorModulo[modulo];
      row.getCell(2).font = { bold: true, color: { argb: 'FF1a3a5c' } };
      worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
      rowIndex++;
    });

    // Línea separadora
    let row = worksheet.getRow(rowIndex);
    row.getCell(1).value = '─────────────────────────────────';
    worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    rowIndex++;

    // Total registros
    row = worksheet.getRow(rowIndex);
    row.getCell(1).value = `📊 TOTAL REGISTROS: ${rows.length}`;
    row.getCell(1).font = { bold: true, size: 12 };
    worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);

    // ============================================
    // GENERAR ARCHIVO
    // ============================================
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().getTime();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Bitacora_${timestamp}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error al generar reporte de bitácora:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte' });
  }
});
export default router;