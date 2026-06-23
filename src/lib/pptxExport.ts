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

function statusLabel(s: Project['status']) {
  return s === 'on-track' ? 'No prazo' : s === 'at-risk' ? 'Em risco' : s === 'delayed' ? 'Atrasado' : 'Concluído';
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
  s1.addText('Modelos de Atendimento', { x: 0.5, y: 1.35, w: 12, h: 0.35, fontSize: 13, bold: true, color: MUTED, fontFace: 'Calibri' });
  const typeCards = [
    { label: 'Total', value: projects.length, color: ACCENT },
    { label: 'Projetos', value: byType.projeto, color: TEXT },
    { label: 'Operações', value: byType.operacao, color: TEXT },
    { label: 'Sustentação', value: byType.sustentacao, color: TEXT },
    { label: 'Dedicado', value: byType.dedicado, color: TEXT },
  ];
  typeCards.forEach((c, i) => {
    const x = 0.5 + i * 2.5;
    s1.addShape('roundRect', { x, y: 1.75, w: 2.3, h: 1.3, fill: { color: 'F3F4F6' }, line: { color: 'E5E7EB', width: 1 }, rectRadius: 0.1 });
    s1.addText(String(c.value), { x, y: 1.85, w: 2.3, h: 0.7, fontSize: 36, bold: true, color: c.color, align: 'center', fontFace: 'Calibri' });
    s1.addText(c.label, { x, y: 2.55, w: 2.3, h: 0.4, fontSize: 12, color: MUTED, align: 'center', fontFace: 'Calibri' });
  });

  // Situação
  s1.addText('Situação Geral', { x: 0.5, y: 3.4, w: 12, h: 0.35, fontSize: 13, bold: true, color: MUTED, fontFace: 'Calibri' });
  const sitCards = [
    { label: 'Estáveis', value: stable.length, color: SUCCESS },
    { label: 'Em Risco', value: atRisk.length, color: WARN },
    { label: 'Críticos', value: critical.length, color: DANGER },
  ];
  sitCards.forEach((c, i) => {
    const x = 0.5 + i * 4.2;
    s1.addShape('roundRect', { x, y: 3.8, w: 4, h: 1.6, fill: { color: c.color + '15' }, line: { color: c.color, width: 1 }, rectRadius: 0.1 });
    s1.addText(String(c.value), { x, y: 3.9, w: 4, h: 0.9, fontSize: 48, bold: true, color: c.color, align: 'center', fontFace: 'Calibri' });
    s1.addText(c.label, { x, y: 4.85, w: 4, h: 0.4, fontSize: 14, color: TEXT, align: 'center', bold: true, fontFace: 'Calibri' });
  });

  // Projetos críticos lista
  s1.addText('Projetos que demandam atenção', { x: 0.5, y: 5.65, w: 12, h: 0.35, fontSize: 13, bold: true, color: MUTED, fontFace: 'Calibri' });
  const attn = [...critical, ...atRisk].slice(0, 6);
  if (attn.length) {
    const rows = attn.map(p => [
      { text: p.name, options: { fontFace: 'Calibri', fontSize: 11, color: TEXT, bold: true } },
      { text: p.category, options: { fontFace: 'Calibri', fontSize: 11, color: MUTED } },
      { text: statusLabel(p.status), options: { fontFace: 'Calibri', fontSize: 11, color: p.status === 'delayed' ? DANGER : WARN, bold: true } },
      { text: `${p.progress}%`, options: { fontFace: 'Calibri', fontSize: 11, color: TEXT, align: 'right' as const } },
    ]);
    s1.addTable(rows, { x: 0.5, y: 6.05, w: 12.3, colW: [5.5, 3.5, 2.0, 1.3], rowH: 0.3, border: { type: 'solid', color: 'E5E7EB', pt: 0.5 } });
  } else {
    s1.addText('Nenhum projeto em risco no momento.', { x: 0.5, y: 6.1, w: 12, h: 0.4, fontSize: 12, color: MUTED, italic: true, fontFace: 'Calibri' });
  }

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