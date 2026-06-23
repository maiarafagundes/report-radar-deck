import pptxgen from 'pptxgenjs';
import { Project } from '@/types/project';

interface ExecutiveSummary {
  resumo: string;
  destaques: { texto: string; projetos: string[] }[];
  riscos: { texto: string; projetos: string[] }[];
  todos: { acao: string; prioridade: string; responsavel: string }[];
}

const NAVY = '1E2761';
const ACCENT = '2563EB';
const SUCCESS = '16A34A';
const WARN = 'D97706';
const DANGER = 'DC2626';
const TEXT = '1F2937';
const MUTED = '6B7280';
const BG = 'FFFFFF';
const SUCCESS_BG = 'DCFCE7';
const WARN_BG = 'FEF3C7';
const DANGER_BG = 'FEE2E2';

function statusLabel(s: Project['status']) {
  return s === 'on-track' ? 'No prazo' : s === 'at-risk' ? 'Em risco' : s === 'delayed' ? 'Atrasado' : 'Concluído';
}

function typeLabel(t: Project['type']) {
  return t === 'operacao' ? 'Operação' : t === 'sustentacao' ? 'Sustentação' : t === 'dedicado' ? 'Dedicado' : 'Projeto';
}

/** Tempo decorrido do projeto até hoje. */
function elapsedLabel(startDate: string): string {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return '—';
  const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years}a ${rem}m` : `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

export async function exportDashboardPptx(projects: Project[], summary: ExecutiveSummary | null) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
  pptx.title = 'Dashboard Executivo';

  const byType = {
    projeto: projects.filter(p => p.type === 'projeto').length,
    operacao: projects.filter(p => p.type === 'operacao').length,
    sustentacao: projects.filter(p => p.type === 'sustentacao').length,
    dedicado: projects.filter(p => p.type === 'dedicado').length,
  };
  const stable = projects.filter(p => p.status === 'on-track' || p.status === 'completed');
  const atRisk = projects.filter(p => p.status === 'at-risk');
  const critical = projects.filter(p => p.status === 'delayed');

  // ============ SLIDE 1: Visão Geral ============
  const s1 = pptx.addSlide();
  s1.background = { color: BG };
  s1.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.1, fill: { color: NAVY } });
  s1.addText('Dashboard Executivo', { x: 0.5, y: 0.18, w: 12, h: 0.5, fontSize: 26, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
  s1.addText(`Portfólio · ${projects.length} projetos · ${new Date().toLocaleDateString('pt-BR')}`, { x: 0.5, y: 0.62, w: 12, h: 0.35, fontSize: 12, color: 'CADCFC', fontFace: 'Calibri' });

  // Modelos de atendimento - cards
  s1.addText('Modelos de Atendimento', { x: 0.5, y: 1.15, w: 12, h: 0.3, fontSize: 12, bold: true, color: MUTED, fontFace: 'Calibri' });
  const typeCards = [
    { label: 'Total', value: projects.length, color: ACCENT },
    { label: 'Projetos', value: byType.projeto, color: TEXT },
    { label: 'Operações', value: byType.operacao, color: TEXT },
    { label: 'Sustentação', value: byType.sustentacao, color: TEXT },
    { label: 'Dedicado', value: byType.dedicado, color: TEXT },
  ];
  typeCards.forEach((c, i) => {
    const x = 0.5 + i * 2.5;
    s1.addShape('roundRect', { x, y: 1.5, w: 2.3, h: 0.95, fill: { color: 'F3F4F6' }, line: { color: 'E5E7EB', width: 1 }, rectRadius: 0.08 });
    s1.addText(String(c.value), { x, y: 1.55, w: 2.3, h: 0.55, fontSize: 26, bold: true, color: c.color, align: 'center', fontFace: 'Calibri' });
    s1.addText(c.label, { x, y: 2.05, w: 2.3, h: 0.35, fontSize: 11, color: MUTED, align: 'center', fontFace: 'Calibri' });
  });

  // Situação Geral - cards compactos com fundo claro
  s1.addText('Situação Geral', { x: 0.5, y: 2.55, w: 12, h: 0.3, fontSize: 12, bold: true, color: MUTED, fontFace: 'Calibri' });
  const sitCards = [
    { label: 'Estáveis', value: stable.length, color: SUCCESS, bg: SUCCESS_BG },
    { label: 'Em Risco', value: atRisk.length, color: WARN, bg: WARN_BG },
    { label: 'Críticos', value: critical.length, color: DANGER, bg: DANGER_BG },
  ];
  sitCards.forEach((c, i) => {
    const x = 0.5 + i * 4.2;
    s1.addShape('roundRect', { x, y: 2.9, w: 4, h: 0.85, fill: { color: c.bg }, line: { color: c.color, width: 1 }, rectRadius: 0.08 });
    s1.addText(String(c.value), { x: x + 0.2, y: 2.95, w: 1.2, h: 0.75, fontSize: 32, bold: true, color: c.color, align: 'center', valign: 'middle', fontFace: 'Calibri' });
    s1.addText(c.label, { x: x + 1.4, y: 2.95, w: 2.5, h: 0.75, fontSize: 14, color: TEXT, bold: true, align: 'left', valign: 'middle', fontFace: 'Calibri' });
  });

  // Todos os projetos
  s1.addText(`Projetos (${projects.length})`, { x: 0.5, y: 3.9, w: 12, h: 0.3, fontSize: 12, bold: true, color: MUTED, fontFace: 'Calibri' });

  const allProjects = [...projects].sort((a, b) => {
    const order: Record<Project['status'], number> = { 'delayed': 0, 'at-risk': 1, 'on-track': 2, 'completed': 3 };
    return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
  });

  const header = [
    { text: 'Projeto', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 10 } },
    { text: 'Tipo', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 10 } },
    { text: 'Categoria', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 10 } },
    { text: 'Status', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 10 } },
    { text: 'Tempo', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 10, align: 'right' as const } },
  ];
  const rows = allProjects.map(p => {
    const sColor = p.status === 'delayed' ? DANGER : p.status === 'at-risk' ? WARN : p.status === 'completed' ? ACCENT : SUCCESS;
    return [
      { text: p.name, options: { fontFace: 'Calibri', fontSize: 9, color: TEXT, bold: true } },
      { text: typeLabel(p.type), options: { fontFace: 'Calibri', fontSize: 9, color: MUTED } },
      { text: p.category, options: { fontFace: 'Calibri', fontSize: 9, color: MUTED } },
      { text: statusLabel(p.status), options: { fontFace: 'Calibri', fontSize: 9, color: sColor, bold: true } },
      { text: elapsedLabel(p.startDate), options: { fontFace: 'Calibri', fontSize: 9, color: TEXT, align: 'right' as const } },
    ];
  });
  // Compute row height to fit available space (4.25 -> 7.3 = 3.05" total)
  const availH = 3.05;
  const totalRows = rows.length + 1;
  const rowH = Math.max(0.18, Math.min(0.34, availH / totalRows));
  s1.addTable([header, ...rows], {
    x: 0.5, y: 4.25, w: 12.3,
    colW: [4.4, 1.8, 2.0, 1.6, 2.5],
    rowH,
    border: { type: 'solid', color: 'E5E7EB', pt: 0.5 },
  });

  // ============ SLIDE 2: Resumo / Destaques / Riscos ============
  const s2 = pptx.addSlide();
  s2.background = { color: BG };
  s2.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.1, fill: { color: NAVY } });
  s2.addText('Status Executivo Consolidado', { x: 0.5, y: 0.18, w: 12, h: 0.5, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
  s2.addText('Análise consolidada do portfólio', { x: 0.5, y: 0.65, w: 12, h: 0.3, fontSize: 12, color: 'CADCFC', fontFace: 'Calibri' });

  if (summary) {
    s2.addText('Resumo', { x: 0.5, y: 1.35, w: 12.3, h: 0.35, fontSize: 13, bold: true, color: ACCENT, fontFace: 'Calibri' });
    s2.addText(summary.resumo, { x: 0.5, y: 1.7, w: 12.3, h: 1.2, fontSize: 12, color: TEXT, fontFace: 'Calibri', valign: 'top' });

    s2.addText('Destaques', { x: 0.5, y: 3.05, w: 6, h: 0.35, fontSize: 13, bold: true, color: SUCCESS, fontFace: 'Calibri' });
    s2.addText(
      summary.destaques.slice(0, 6).map(d => ({ text: d.texto, options: { bullet: { code: '25CF' }, color: TEXT, fontSize: 11, fontFace: 'Calibri' } })),
      { x: 0.5, y: 3.4, w: 6.1, h: 3.8, valign: 'top' }
    );

    s2.addText('Riscos', { x: 6.8, y: 3.05, w: 6, h: 0.35, fontSize: 13, bold: true, color: DANGER, fontFace: 'Calibri' });
    s2.addText(
      summary.riscos.slice(0, 6).map(r => ({ text: r.texto, options: { bullet: { code: '25CF' }, color: TEXT, fontSize: 11, fontFace: 'Calibri' } })),
      { x: 6.8, y: 3.4, w: 6.1, h: 3.8, valign: 'top' }
    );
  } else {
    s2.addText('Status executivo ainda não gerado. Gere a análise no dashboard antes de exportar para incluir o consolidado de IA.',
      { x: 0.5, y: 3, w: 12.3, h: 1, fontSize: 13, color: MUTED, italic: true, align: 'center', fontFace: 'Calibri' });
  }

  // ============ SLIDE 3: TO-DOs ============
  if (summary && summary.todos.length) {
    const s3 = pptx.addSlide();
    s3.background = { color: BG };
    s3.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.1, fill: { color: NAVY } });
    s3.addText('Ações Recomendadas', { x: 0.5, y: 0.18, w: 12, h: 0.5, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
    s3.addText(`${summary.todos.length} TO-DOs priorizados`, { x: 0.5, y: 0.65, w: 12, h: 0.3, fontSize: 12, color: 'CADCFC', fontFace: 'Calibri' });

    const header = [
      { text: 'Prioridade', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 11 } },
      { text: 'Ação', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 11 } },
      { text: 'Responsável', options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: 'Calibri', fontSize: 11 } },
    ];
    const rows = summary.todos.slice(0, 10).map(t => {
      const pc = t.prioridade === 'alta' ? DANGER : t.prioridade === 'media' ? WARN : SUCCESS;
      return [
        { text: String(t.prioridade).toUpperCase(), options: { color: pc, bold: true, fontFace: 'Calibri', fontSize: 11 } },
        { text: t.acao, options: { color: TEXT, fontFace: 'Calibri', fontSize: 11 } },
        { text: t.responsavel, options: { color: MUTED, fontFace: 'Calibri', fontSize: 11 } },
      ];
    });
    s3.addTable([header, ...rows], { x: 0.5, y: 1.4, w: 12.3, colW: [1.8, 7.5, 3.0], border: { type: 'solid', color: 'E5E7EB', pt: 0.5 }, rowH: 0.45 });
  }

  const filename = `dashboard-executivo-${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: filename });
}