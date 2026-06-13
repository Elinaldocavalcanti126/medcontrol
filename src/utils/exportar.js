// src/utils/exportar.js
// Funções para exportar dados em CSV e Excel (xlsx).

import * as XLSX from 'xlsx';

/**
 * Exporta array de objetos para CSV e faz download automático.
 * @param {Array}  dados    – array de objetos
 * @param {string} nomeArquivo – sem extensão
 */
export function exportarCSV(dados, nomeArquivo = 'relatorio') {
  if (!dados?.length) return;
  const cabecalho = Object.keys(dados[0]).join(';');
  const linhas = dados.map(row =>
    Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')
  );
  const csv = [cabecalho, ...linhas].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  download(blob, `${nomeArquivo}.csv`);
}

/**
 * Exporta array de objetos para arquivo Excel (.xlsx).
 */
export function exportarExcel(dados, nomeArquivo = 'relatorio', nomePlanilha = 'Dados') {
  if (!dados?.length) return;
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}

function download(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
