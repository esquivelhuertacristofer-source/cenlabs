import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PLANEAMIENTOS } from "./planeamientos";

const BRAND_COLORS = {
  navy: "#023047",
  orange: "#FB8500",
  cerulean: "#219EBC",
  lightBlue: "#8ECAE6",
  white: "#FFFFFF",
  gray: "#F0F4F8",
  textGray: "#64748B"
};

/**
 * Dibuja el encabezado premium con el logo estilizado de CEN Labs
 */
const drawHeader = (doc: jsPDF, title: string, subtitle: string) => {
  // Fondo de encabezado
  doc.setFillColor(BRAND_COLORS.navy);
  doc.rect(0, 0, 210, 45, "F");
  
  // Logo Estilizado (CEN Labs Badge)
  // Cuadrado naranja
  doc.setFillColor(BRAND_COLORS.orange);
  doc.roundedRect(15, 10, 15, 15, 3, 3, "F");
  
  // Texto CEN
  doc.setTextColor(BRAND_COLORS.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CEN", 35, 20);
  
  doc.setFontSize(8);
  doc.setTextColor(BRAND_COLORS.lightBlue);
  doc.text("LABORATORIOS VIRTUALES", 35, 25);
  
  // Título del Reporte
  doc.setTextColor(BRAND_COLORS.white);
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), 195, 20, { align: "right" });
  
  doc.setFontSize(9);
  doc.setTextColor(BRAND_COLORS.lightBlue);
  doc.text(subtitle, 195, 26, { align: "right" });
  
  // Línea divisoria decorativa naranja
  doc.setDrawColor(BRAND_COLORS.orange);
  doc.setLineWidth(1);
  doc.line(0, 45, 210, 45);
};

export const generateStudentReport = (student: any) => {
  const doc = new jsPDF();
  
  // 1. Encabezado
  drawHeader(doc, "Informe Individual de Desempeño", `Alumno: ${student.full_name || student.name}`);
  
  // 2. Información del Alumno
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL ESTUDIANTE", 15, 60);
  doc.line(15, 62, 100, 62);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nombre: ${student.full_name || student.name}`, 15, 70);
  doc.text(`Correo: ${student.email}`, 15, 75);
  doc.text(`Grupo: ${student.grupo || "General"}`, 15, 80);
  doc.text(`Fecha de Emisión: ${format(new Date(), "PPpp", { locale: es })}`, 15, 85);
  
  // 3. Resumen de Métricas (Tarjetas visuales)
  doc.setFillColor(BRAND_COLORS.gray);
  doc.roundedRect(120, 55, 75, 35, 5, 5, "F");
  
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PROMEDIO GRAL.", 157.5, 70, { align: "center" });
  
  doc.setFontSize(24);
  doc.setTextColor(BRAND_COLORS.cerulean);
  doc.text(`${student.score || 0}`, 157.5, 82, { align: "center" });
  
  // 4. Tabla de Prácticas
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("HISTORIAL DE LABORATORIOS", 15, 105);
  
  // Encabezado de tabla
  doc.setFillColor(BRAND_COLORS.navy);
  doc.rect(15, 110, 180, 8, "F");
  doc.setTextColor(BRAND_COLORS.white);
  doc.setFontSize(8);
  doc.text("ESCENARIO / PRÁCTICA", 20, 115);
  doc.text("ESTADO", 100, 115);
  doc.text("CALIFICACIÓN", 155, 115);
  
  let y = 125;
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFont("helvetica", "normal");
  
  const practices = student.practices || [];
  
  if (practices.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("No se registran prácticas completadas aún.", 15, y);
  } else {
    practices.forEach((p: any, i: number) => {
      if (y > 270) { doc.addPage(); y = 20; }
      
      // Fondo cebra
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 5, 180, 8, "F");
      }
      
      doc.text(p.name?.substring(0, 45) || "Sin nombre", 20, y);
      doc.text(p.status?.toUpperCase().replace('_', ' ') || "COMPLETADA", 100, y);
      doc.text(`${p.score || 0}/10`, 155, y);
      y += 8;
    });
  }
  
  // Pie de página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.textGray);
    doc.text(`Página ${i} de ${pageCount} | Generado por CEN Laboratorios v1.0`, 105, 290, { align: "center" });
  }

  doc.save(`Reporte_Individual_${student.full_name || "Alumno"}.pdf`);
};

export const generateGroupReport = (groupName: string, students: any[]) => {
  const doc = new jsPDF();
  
  // 1. Encabezado
  drawHeader(doc, "Reporte Gerencial de Grupo", `Grupo: ${groupName.toUpperCase()}`);
  
  // 2. Resumen Ejecutivo
  const totalAlumnos = students.length;
  const promedioGrupal = totalAlumnos > 0 
    ? (students.reduce((acc, s) => acc + (s.score || 0), 0) / totalAlumnos).toFixed(1)
    : "0";
  
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN DEL GRUPO", 15, 60);
  
  doc.setFillColor(BRAND_COLORS.gray);
  doc.roundedRect(15, 65, 180, 25, 4, 4, "F");
  
  doc.setFontSize(8);
  doc.setTextColor(BRAND_COLORS.textGray);
  doc.text("TOTAL ALUMNOS:", 25, 75);
  doc.text("PROMEDIO GRUPAL:", 85, 75);
  doc.text("FECHA REPORTE:", 145, 75);
  
  doc.setFontSize(12);
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalAlumnos}`, 25, 83);
  doc.text(`${promedioGrupal}/10`, 85, 83);
  doc.text(format(new Date(), "dd/MM/yyyy"), 145, 83);
  
  // 3. Tabla de Ranking y Desempeño
  doc.setFontSize(10);
  doc.text("LISTADO DE DESEMPEÑO", 15, 105);
  
  // Encabezado de tabla
  doc.setFillColor(BRAND_COLORS.navy);
  doc.rect(15, 110, 180, 8, "F");
  doc.setTextColor(BRAND_COLORS.white);
  doc.setFontSize(8);
  doc.text("NOMBRE DEL ALUMNO", 20, 115);
  doc.text("PRACTICAS", 100, 115);
  doc.text("PROMEDIO", 135, 115);
  doc.text("CORREO", 160, 115);
  
  let y = 125;
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFont("helvetica", "normal");
  
  const sortedStudents = [...students].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  sortedStudents.forEach((s, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, 180, 8, "F");
    }
    
    doc.text(s.full_name?.substring(0, 35) || "Sin nombre", 20, y);
    doc.text(`${s.completadas || 0}`, 100, y);
    doc.text(`${s.score || 0}`, 135, y);
    doc.setFontSize(7);
    doc.text(s.email?.substring(0, 25) || "", 160, y);
    doc.setFontSize(8);
    
    y += 8;
  });

  // Pie de página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.textGray);
    doc.text(`Página ${i} de ${pageCount} | Generado por CEN Laboratorios v1.0`, 105, 290, { align: "center" });
  }

  doc.save(`Reporte_Grupo_${groupName || "General"}.pdf`);
};

/**
 * GENERA UNA FICHA DE REFUERZO PEDAGÓGICO PERSONALIZADA
 * Cruza el score del alumno con el marco teórico del laboratorio.
 */
export const generateReinforcementReport = (student: any, practice: any) => {
  const doc = new jsPDF();
  const plan = PLANEAMIENTOS[practice.id];
  
  // 1. Encabezado Especializado
  drawHeader(doc, "Ficha de Refuerzo Académico", `${practice.name}`);
  
  // 2. Estado del Alumno
  doc.setFillColor(BRAND_COLORS.gray);
  doc.roundedRect(15, 55, 180, 40, 5, 5, "F");
  
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ANÁLISIS DE DESEMPEÑO", 25, 65);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Alumno: ${student.full_name || student.name}`, 25, 75);
  doc.text(`Resultado: ${practice.score}/10`, 25, 80);
  
  // Mensaje motivacional / Alerta según nota
  const score = practice.score || 0;
  doc.setFont("helvetica", "bold");
  if (score < 7) {
    doc.setTextColor("#CC0000");
    doc.text("ESTADO: REQUIERE REFUERZO INMEDIATO", 25, 90);
  } else {
    doc.setTextColor("#008000");
    doc.text("ESTADO: CONSOLIDACIÓN DE CONOCIMIENTOS", 25, 90);
  }

  // 3. Fundamentos Teóricos (Inyección Dinámica)
  doc.setTextColor(BRAND_COLORS.navy);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. MARCO TEÓRICO FUNDAMENTAL", 15, 110);
  doc.line(15, 112, 100, 112);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const teoria = plan?.teoria || "Consulte la guía docente para más detalles sobre este tema.";
  const splitTeoria = doc.splitTextToSize(teoria, 180);
  doc.text(splitTeoria, 15, 120);
  
  let currentY = 120 + (splitTeoria.length * 5) + 10;
  
  // 4. Conceptos Clave para Repaso
  if (currentY > 250) { doc.addPage(); currentY = 20; }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. CONCEPTOS CLAVE PARA EL ÉXITO", 15, currentY);
  doc.line(15, currentY+2, 100, currentY+2);
  currentY += 12;
  
  if (plan?.conceptosClave) {
    plan.conceptosClave.forEach((c: any) => {
      if (currentY > 270) { doc.addPage(); currentY = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`• ${c.termino}:`, 15, currentY);
      doc.setFont("helvetica", "normal");
      const desc = doc.splitTextToSize(c.definicion, 160);
      doc.text(desc, 45, currentY);
      currentY += (desc.length * 5) + 3;
    });
  }

  // 5. Recomendación Docente
  if (currentY > 260) { doc.addPage(); currentY = 20; }
  doc.setFillColor(BRAND_COLORS.navy);
  doc.rect(15, currentY, 180, 20, "F");
  doc.setTextColor(BRAND_COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SUGERENCIA PEDAGÓGICA PARA EL ESTUDIANTE:", 20, currentY + 8);
  doc.setFont("helvetica", "normal");
  doc.text(score < 7 
    ? "Se recomienda repetir la simulación prestando especial atención a las variables resaltadas en la sección de conceptos."
    : "Excelente desempeño. Se sugiere profundizar en los fundamentos teóricos para aplicaciones avanzadas.", 20, currentY + 14);

  // Pie de página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.textGray);
    doc.text(`CEN Labs | Reporte de Inteligencia Pedagógica | Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
  }

  doc.save(`Refuerzo_${practice.name}_${student.full_name || "Alumno"}.pdf`);
};
