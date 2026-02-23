import { Project } from '@/types/project';
import { getStatusLabel, formatDateShort } from '@/lib/projectUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateProjectPDF = (project: Project) => {
  const doc = new jsPDF();
  const latestReport = project.weeklyReports[0];

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS REPORT EXECUTIVO', 15, 18);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(project.name, 15, 28);

  doc.setFontSize(9);
  doc.text(`${project.category} | ${formatDateShort(new Date().toISOString().split('T')[0])}`, 15, 35);

  // Status badge
  const statusColor = project.status === 'on-track' ? [34, 197, 94] :
    project.status === 'delayed' ? [239, 68, 68] : [245, 158, 11];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(150, 12, 45, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(getStatusLabel(project.status).toUpperCase(), 172.5, 18.5, { align: 'center' });

  let y = 50;
  doc.setTextColor(30, 41, 59);

  // Project info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Projeto', 15, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Campo', 'Valor']],
    body: [
      ['Progresso', `${project.progress}%`],
      ['Início', formatDateShort(project.startDate)],
      ['Prazo Final', formatDateShort(project.endDate)],
      ['Equipe', `${project.team.length} membros`],
      ['Status', getStatusLabel(project.status)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Latest report
  if (latestReport) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Último Report (${formatDateShort(latestReport.weekStart)} - ${formatDateShort(latestReport.weekEnd)})`, 15, y);
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(latestReport.summary, 180);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 5 + 5;

    // Metrics
    autoTable(doc, {
      startY: y,
      head: [['Deploys', 'Tasks', 'Incidentes', 'Uptime']],
      body: [[
        String(latestReport.metrics.deploymentsCount),
        `${latestReport.metrics.tasksCompleted}/${latestReport.metrics.tasksTotal}`,
        String(latestReport.metrics.incidentsResolved),
        `${latestReport.metrics.uptimePercent}%`,
      ]],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 10, halign: 'center', fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    if (latestReport.highlights.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('Destaques', 15, y);
      y += 5;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      latestReport.highlights.forEach(h => {
        doc.text(`• ${h}`, 18, y);
        y += 5;
      });
      y += 3;
    }

    if (latestReport.blockers.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('Blockers', 15, y);
      y += 5;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      latestReport.blockers.forEach(b => {
        doc.text(`• ${b}`, 18, y);
        y += 5;
      });
    }
  }

  // Team table
  y = Math.min(y + 10, 230);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Equipe', 15, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Nome', 'Cargo', 'Senioridade']],
    body: project.team.map(m => [m.name, m.role, m.seniority]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
  });

  // Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setTextColor(150, 160, 180);
  doc.setFontSize(7);
  doc.text('Documento gerado automaticamente — Status Report Dashboard', 105, 290, { align: 'center' });

  doc.save(`status-report-${project.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
