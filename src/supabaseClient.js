// src/supabaseClient.js
// Inicialização e exportação do cliente Supabase.
// As credenciais vêm de variáveis de ambiente (.env) para não expor no código.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('⚠️  Variáveis REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY não definidas.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
