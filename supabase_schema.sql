-- ============================================================
-- MedControl – Script de criação de tabelas no Supabase
-- Execute no SQL Editor do painel do Supabase
-- ============================================================

-- 1. Tabela de perfis de usuário (ligada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  perfil     TEXT NOT NULL CHECK (perfil IN ('administrador', 'farmaceutico', 'estoque')),
  ativo      BOOLEAN DEFAULT TRUE,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categorias de produtos
CREATE TABLE IF NOT EXISTS public.categorias (
  id        SERIAL PRIMARY KEY,
  nome      TEXT NOT NULL UNIQUE,
  descricao TEXT
);

-- 3. Produtos / medicamentos
CREATE TABLE IF NOT EXISTS public.produtos (
  id           SERIAL PRIMARY KEY,
  nome         TEXT NOT NULL,
  codigo_catmat TEXT,
  lote         TEXT NOT NULL,
  validade     DATE NOT NULL,
  quantidade   INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER DEFAULT 10,
  categoria_id INTEGER REFERENCES public.categorias(id),
  unidade      TEXT DEFAULT 'UN',
  fabricante   TEXT,
  ativo        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Movimentações de estoque
CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id          SERIAL PRIMARY KEY,
  produto_id  INTEGER NOT NULL REFERENCES public.produtos(id),
  usuario_id  UUID NOT NULL REFERENCES public.usuarios(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade  INTEGER NOT NULL,
  observacao  TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Logs de auditoria
CREATE TABLE IF NOT EXISTS public.logs (
  id         SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id),
  acao       TEXT NOT NULL,
  tabela     TEXT,
  registro_id TEXT,
  detalhes   JSONB,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs           ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem ler tudo
CREATE POLICY "Leitura autenticada" ON public.produtos      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura autenticada" ON public.categorias    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura autenticada" ON public.movimentacoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura autenticada" ON public.logs          FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura autenticada" ON public.usuarios      FOR SELECT USING (auth.role() = 'authenticated');

-- Farmacêutico e estoque podem inserir movimentações
CREATE POLICY "Inserir movimentacao" ON public.movimentacoes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Administrador gerencia produtos e usuários (via service_role no backend ou RLS mais granular)
CREATE POLICY "Inserir produto" ON public.produtos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Atualizar produto" ON public.produtos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Inserir log" ON public.logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Trigger: atualiza quantidade do produto após movimentação
CREATE OR REPLACE FUNCTION public.atualizar_estoque()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.produtos SET quantidade = quantidade + NEW.quantidade, atualizado_em = NOW() WHERE id = NEW.produto_id;
  ELSIF NEW.tipo = 'saida' THEN
    UPDATE public.produtos SET quantidade = quantidade - NEW.quantidade, atualizado_em = NOW() WHERE id = NEW.produto_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE public.produtos SET quantidade = NEW.quantidade, atualizado_em = NOW() WHERE id = NEW.produto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_atualizar_estoque
AFTER INSERT ON public.movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.atualizar_estoque();

-- Dados iniciais: categorias
INSERT INTO public.categorias (nome, descricao) VALUES
  ('Analgésicos', 'Medicamentos para alívio da dor'),
  ('Antibióticos', 'Medicamentos antimicrobianos'),
  ('Anti-hipertensivos', 'Controle da pressão arterial'),
  ('Vitaminas', 'Suplementos vitamínicos'),
  ('Outros', 'Demais medicamentos');
