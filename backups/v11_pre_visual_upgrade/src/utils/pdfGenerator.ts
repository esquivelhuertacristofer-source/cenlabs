import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface ReportData {
  titulo: string;
  materia: string;
  alumno: string;
  fecha: Date;
  bitacoraData: Record<string, any>;
  score: number;
  time: string;
}

export const generateLabReport = async (data: ReportData) => {
  const doc = new jsPDF();
  const navy = '#023047';
  const orange = '#FB8500';

  // --- HEADER ---
  doc.setFillColor(navy);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('REPORTE DE LABORATORIO', 105, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CEN LABS VIRTUAL PLATFORM - SECUENCIA DE APRENDIZAJE GOLD', 105, 28, { align: 'center' });

  // --- INFO BLOCK ---
  doc.setTextColor(navy);
  doc.setFontSize(14);
  doc.text('INFORMACIÓN DE LA PRÁCTICA', 20, 55);
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 58, 190, 58);

  doc.setFontSize(10);
  doc.text(`TÍTULO: ${data.titulo.toUpperCase()}`, 20, 68);
  doc.text(`MATERIA: ${data.materia.toUpperCase()}`, 20, 75);
  doc.text(`ALUMNO: ${data.alumno.toUpperCase()}`, 20, 82);
  doc.text(`FECHA: ${format(data.fecha, 'dd/MM/yyyy HH:mm')}`, 140, 68);
  doc.text(`PUNTAJE: ${data.score}/100`, 140, 75);
  doc.text(`TIEMPO TOTAL: ${data.time}`, 140, 82);

  // --- BITÁCORA CONTENT ---
  doc.setFontSize(14);
  doc.text('RESULTADOS Y NOTAS', 20, 100);
  doc.line(20, 103, 190, 103);

  doc.setFontSize(10);
  let y = 113;
  
  Object.entries(data.bitacoraData).forEach(([key, value]) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    const label = key.toUpperCase().replace(/_/g, ' ');
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 25, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(value), 140);
    doc.text(lines, 65, y);
    y += (lines.length * 5) + 5;
  });

  // --- DISCREET PROFESSOR SECTION ---
  y = Math.max(y, 240);
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([2, 1], 0);
  doc.line(20, y, 190, y);
  
  doc.setFontSize(8);
  doc.setTextColor('#94A3B8');
  doc.text('ÁREA RESERVADA PARA EL DOCENTE', 20, y + 5);
  
  doc.text('OBSERVACIONES:', 20, y + 15);
  doc.rect(20, y + 18, 140, 20);
  
  doc.text('CALIFICACIÓN FINAL:', 165, y + 15);
  doc.rect(165, y + 18, 25, 20);

  // --- FOOTER ---
  doc.setFontSize(8);
  doc.text(`Reporte generado por CEN Labs Engine v9 - ${format(new Date(), 'yyyy')}`, 105, 285, { align: 'center' });

  doc.save(`CEN_Reporte_${data.titulo.replace(/\s+/g, '_')}.pdf`);
};
