/**
 * generate-credentials-pdf.js
 * Genera output/credenciales-grupo-piloto-001.pdf
 * Ejecutar: node scripts/generate-credentials-pdf.js
 */

const { jsPDF } = require('jspdf')
const { applyPlugin, autoTable } = require('jspdf-autotable')
applyPlugin(jsPDF)
const { writeFileSync, mkdirSync, existsSync } = require('fs')
const { resolve } = require('path')

// ── Colores CEN Labs (Diamond State) ────────────────────────────────────────
const NAVY    = [2, 48, 71]       // #023047
const CERULEAN= [33, 158, 188]    // #219EBC
const ORANGE  = [251, 133, 0]     // #FB8500
const LIGHT   = [248, 250, 252]   // #F8FAFC
const WHITE   = [255, 255, 255]
const GRAY    = [100, 116, 139]   // slate-500
const DARK    = [15, 23, 42]      // slate-900

// ── Datos ────────────────────────────────────────────────────────────────────
const FECHA     = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
const PLATAFORMA = 'http://localhost:3001'
const GRUPO     = 'GRUPO-PILOTO-001'

const USUARIOS = [
  { nombre: 'Profesor Piloto',          email: 'profesor.piloto@cenlaboratorios.com',        password: 'piloto2026', rol: 'Profesor' },
  { nombre: 'Sofía Martínez García',    email: 'sofia.martinez.garcia@cenlaboratorios.com',   password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Diego Hernández López',    email: 'diego.hernandez.lopez@cenlaboratorios.com',   password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Valentina Ramírez Cruz',   email: 'valentina.ramirez.cruz@cenlaboratorios.com',  password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Mateo González Pérez',     email: 'mateo.gonzalez.perez@cenlaboratorios.com',    password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Ximena Torres Sánchez',    email: 'ximena.torres.sanchez@cenlaboratorios.com',   password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Sebastián Flores Rivera',  email: 'sebastian.flores.rivera@cenlaboratorios.com', password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Camila Vázquez Morales',   email: 'camila.vazquez.morales@cenlaboratorios.com',  password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Emiliano Castro Jiménez',  email: 'emiliano.castro.jimenez@cenlaboratorios.com', password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Isabella Ruiz Mendoza',    email: 'isabella.ruiz.mendoza@cenlaboratorios.com',   password: 'piloto2026', rol: 'Alumno' },
  { nombre: 'Santiago Aguilar Romero',  email: 'santiago.aguilar.romero@cenlaboratorios.com', password: 'piloto2026', rol: 'Alumno' },
]

// ── Helper: RGB array → CSS hex ──────────────────────────────────────────────
function rgb(arr) { return arr }

// ── Build PDF ────────────────────────────────────────────────────────────────
function buildPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 18

  // ── HEADER BLOCK ──────────────────────────────────────────────────────────
  // Navy background
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 52, 'F')

  // Orange accent bar
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, 6, 52, 'F')

  // CEN LABS wordmark
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('CEN LABS', 16, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(142, 202, 230)  // #8ECAE6
  doc.text('Plataforma de Laboratorios Virtuales de Ciencias', 16, 25)

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...WHITE)
  doc.text('Credenciales de Acceso', 16, 37)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(142, 202, 230)
  doc.text(`Grupo: ${GRUPO}  ·  Generado el ${FECHA}`, 16, 44)

  // ── INFO STRIP ────────────────────────────────────────────────────────────
  let y = 60

  doc.setFillColor(...LIGHT)
  doc.roundedRect(margin, y, W - margin * 2, 22, 3, 3, 'F')
  doc.setDrawColor(...CERULEAN)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, y, W - margin * 2, 22, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...CERULEAN)
  doc.text('PLATAFORMA', margin + 6, y + 7)
  doc.text('CONTRASEÑA COMÚN', margin + 80, y + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text(PLATAFORMA, margin + 6, y + 15)
  doc.text('piloto2026', margin + 80, y + 15)

  // ── CREDENTIALS TABLE ─────────────────────────────────────────────────────
  y += 32

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...NAVY)
  doc.text('Listado de Usuarios', margin, y)

  y += 6

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Nombre Completo', 'Email Institucional', 'Contraseña', 'Rol']],
    body: USUARIOS.map(u => [u.nombre, u.email, u.password, u.rol]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      textColor: DARK,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: LIGHT,
    },
    tableWidth: 174,
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { cellWidth: 76, textColor: GRAY },
      2: { cellWidth: 28, halign: 'center', fontStyle: 'bold', textColor: CERULEAN },
      3: { cellWidth: 24, halign: 'center' },
    },
    // Row style: highlight professor
    didParseCell: (data) => {
      if (data.row.index === 0 && data.section === 'body') {
        data.cell.styles.fillColor = [239, 249, 255]
      }
    },
  })

  // ── INSTRUCTIONS BLOCK ────────────────────────────────────────────────────
  const afterTable = doc.lastAutoTable.finalY + 10

  doc.setFillColor(...NAVY)
  doc.roundedRect(margin, afterTable, W - margin * 2, 28, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...ORANGE)
  doc.text('INSTRUCCIONES DE ACCESO', margin + 6, afterTable + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(142, 202, 230)
  doc.text(`1. Abre tu navegador y ve a: ${PLATAFORMA}`, margin + 6, afterTable + 15)
  doc.text('2. Ingresa tu correo electrónico y la contraseña indicada.', margin + 6, afterTable + 21)
  doc.text('3. Acepta el Aviso de Privacidad y haz clic en "Iniciar Sesión".', margin + 6, afterTable + 27)

  // ── SECURITY NOTE ─────────────────────────────────────────────────────────
  const noteY = afterTable + 36

  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.text(
    '⚠  Mantén tus credenciales en privado. No compartas tu contraseña con nadie.',
    W / 2, noteY, { align: 'center' }
  )

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const pageH = 297
  doc.setFillColor(...NAVY)
  doc.rect(0, pageH - 14, W, 14, 'F')

  doc.setFillColor(...ORANGE)
  doc.rect(0, pageH - 14, 6, 14, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(142, 202, 230)
  doc.text('CEN Labs · Plataforma de Laboratorios Virtuales · Documento confidencial', W / 2, pageH - 5, { align: 'center' })

  return doc
}

// ── Output ────────────────────────────────────────────────────────────────────
const outputDir = resolve(__dirname, '../output')
mkdirSync(outputDir, { recursive: true })

const doc = buildPDF()
const pdfPath = resolve(outputDir, 'credenciales-grupo-piloto-001.pdf')
const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
writeFileSync(pdfPath, pdfBuffer)

console.log('✅  PDF generado:', pdfPath)
console.log('    Páginas: 1')
console.log('    Tamaño: ' + (pdfBuffer.length / 1024).toFixed(1) + ' KB')
console.log('    Usuarios incluidos:', USUARIOS.length)
console.log('    Columnas: Nombre / Email / Contraseña / Rol')
console.log()
console.log('Preview del contenido:')
console.log('  ┌─ Header navy con barra naranja lateral')
console.log('  ├─ "CEN LABS" + subtítulo en azul claro')
console.log('  ├─ Título: Credenciales de Acceso / Grupo / Fecha')
console.log('  ├─ Strip de info: URL de plataforma + contraseña común')
console.log('  ├─ Tabla de 11 usuarios con colores alternados')
console.log('  │   └─ Fila del profesor resaltada en azul claro')
console.log('  ├─ Bloque navy: instrucciones de acceso en 3 pasos')
console.log('  ├─ Nota de seguridad sobre privacidad de contraseña')
console.log('  └─ Footer navy con barra naranja: texto confidencial centrado')
