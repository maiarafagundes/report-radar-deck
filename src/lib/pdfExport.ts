import { Project, WeeklyReport } from '@/types/project';
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

export const generateWeeklyReportPDF = (project: Project, report: WeeklyReport) => {
  const doc = new jsPDF();
  const pageWidth = 210;
  const margin = 15;
  const maxY = 275;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS REPORT SEMANAL', margin, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(project.name, margin, 25);
  doc.setFontSize(9);
  doc.text(
    `${project.category} • Semana ${formatDateShort(report.weekStart)} a ${formatDateShort(report.weekEnd)}`,
    margin,
    33,
  );

  const statusColor =
    report.status === 'on-track'
      ? [34, 197, 94]
      : report.status === 'delayed'
      ? [239, 68, 68]
      : report.status === 'completed'
      ? [59, 130, 246]
      : [245, 158, 11];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(150, 12, 45, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(getStatusLabel(report.status).toUpperCase(), 172.5, 18.5, { align: 'center' });

  let y = 50;
  doc.setTextColor(30, 41, 59);

  const ensureSpace = (needed: number) => {
    if (y + needed > maxY) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionTitle = (n: number, title: string, rgb: [number, number, number]) => {
    ensureSpace(12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text(`${n}. ${title}`, margin, y);
    y += 6;
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  };

  const writeBullets = (items: string[]) => {
    items.forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, pageWidth - margin * 2 - 4);
      ensureSpace(lines.length * 5 + 2);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 1;
    });
    y += 4;
  };

  const writeParagraph = (text: string) => {
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  // 1. Resumo
  sectionTitle(1, 'Resumo da semana', [30, 41, 59]);
  writeParagraph(report.summary || '—');

  // 2. Entregas / Destaques
  if (report.highlights.length) {
    sectionTitle(2, 'Entregas / Destaques', [34, 197, 94]);
    writeBullets(report.highlights);
  }

  // 3. Em andamento
  if (report.inProgress?.length) {
    sectionTitle(3, 'Em andamento', [59, 130, 246]);
    writeBullets(report.inProgress);
  }

  // 4. Riscos / Bloqueios
  if (report.blockers.length) {
    sectionTitle(4, 'Riscos / Bloqueios', [239, 68, 68]);
    writeBullets(report.blockers);
  }

  // 5. Próximos passos
  if (report.nextSteps?.length) {
    sectionTitle(5, 'Próximos passos', [245, 158, 11]);
    writeBullets(report.nextSteps);
  }

  // 6. Indicadores
  if (report.indicators?.length) {
    sectionTitle(6, 'Indicadores', [30, 41, 59]);
    writeBullets(report.indicators);
  }

  // Footer on every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 282, pageWidth, 15, 'F');
    doc.setTextColor(150, 160, 180);
    doc.setFontSize(7);
    doc.text(
      `${project.name} • Report semanal ${formatDateShort(report.weekStart)}-${formatDateShort(report.weekEnd)}`,
      margin,
      290,
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
  }

  const slug = `${project.name}-${report.weekStart}`.replace(/\s+/g, '-').toLowerCase();
  doc.save(`status-semanal-${slug}.pdf`);
};
