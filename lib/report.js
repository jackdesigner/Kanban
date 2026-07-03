import { formatDate } from './date';

const MD_ICONS = {
  schedule: '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="#000" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
  location: '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="#000" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
  person: '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="#000" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
};

function locationLabel(card) {
  if (card.city || card.state) {
    return [card.city, card.state].filter(Boolean).join(' – ');
  }
  return card.cityState || '';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportBoardReport(board) {
  if (typeof window === 'undefined') return;

  const issued = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  let sections = '';

  board.columnOrder.forEach((colId) => {
    const col = board.columns[colId];
    const cards = col.cardIds
      .map((id) => board.cards[id])
      .filter((c) => c && !c.archived);

    if (cards.length === 0) return;

    sections += `<section class="stage">
      <h2>${escapeHtml(col.title)}</h2>
      <table>
        <thead><tr>
          <th>Projeto</th>
          <th>Cliente Responsável</th>
          <th>Local</th>
          <th>Prazo</th>
        </tr></thead>
        <tbody>`;

    cards.forEach((card) => {
      const loc = locationLabel(card);
      sections += `<tr>
        <td>${escapeHtml(card.title || 'sem título')}</td>
        <td>${escapeHtml(card.clientName || '—')}</td>
        <td>${loc ? `${MD_ICONS.location} ${escapeHtml(loc)}` : '—'}</td>
        <td>${card.dueDate ? `${MD_ICONS.schedule} ${escapeHtml(formatDate(card.dueDate))}` : '—'}</td>
      </tr>`;
    });

    sections += '</tbody></table></section>';
  });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Relatório de Projetos — ${issued}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Consolas, 'SFMono-Regular', Menlo, Monaco, monospace;
    font-size: 11pt;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  header { margin-bottom: 24px; border-bottom: 1px solid #000; padding-bottom: 12px; }
  h1 { font-size: 14pt; margin: 0 0 6px; font-weight: 700; }
  .meta { font-size: 10pt; color: #333; }
  h2 { font-size: 11pt; margin: 20px 0 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.03em; }
  td svg { vertical-align: middle; margin-right: 3px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <header>
    <h1>Relatório de Projetos — Processo de Sistemas</h1>
    <p class="meta">Emitido em ${escapeHtml(issued)}</p>
  </header>
  ${sections || '<p>Nenhum projeto ativo.</p>'}
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
