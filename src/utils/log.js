// src/utils/log.js
// Registra ações do usuário na tabela de logs para auditoria.

import { supabase } from '../supabaseClient';

/**
 * @param {string} acao       – ex: 'criar_produto', 'login', 'exportar_relatorio'
 * @param {string} tabela     – tabela afetada (opcional)
 * @param {string|number} registroId – ID do registro (opcional)
 * @param {object} detalhes   – dados extras em JSON (opcional)
 */
export async function registrarLog(acao, tabela = null, registroId = null, detalhes = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('logs').insert({
      usuario_id:  user?.id ?? null,
      acao,
      tabela,
      registro_id: registroId ? String(registroId) : null,
      detalhes,
    });
  } catch (_) {
    // Silencia erros de log para não quebrar o fluxo principal
  }
}
