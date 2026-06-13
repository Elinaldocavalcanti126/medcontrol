# ⚕ MedControl
**Sistema de Gestão Farmacêutica Hospitalar**  
React + Supabase · Controle de estoque com perfis, auditoria e relatórios exportáveis.

---

## 📁 Estrutura de diretórios

```
medcontrol/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── RotaProtegida.js      ← guarda rotas autenticadas
│   │   └── layout/
│   │       └── Sidebar.js            ← navegação lateral
│   ├── hooks/
│   │   └── useAuth.js                ← contexto de autenticação + permissões
│   ├── pages/
│   │   ├── Login.js                  ← login e cadastro
│   │   ├── Dashboard.js              ← KPIs + gráficos (Recharts)
│   │   ├── Produtos.js               ← CRUD de medicamentos
│   │   ├── Movimentacoes.js          ← entrada / saída / ajuste
│   │   ├── Relatorios.js             ← exportação CSV e Excel
│   │   └── Usuarios.js               ← admin de usuários (admin only)
│   ├── styles/
│   │   └── global.css                ← design system completo
│   ├── utils/
│   │   ├── exportar.js               ← CSV e Excel via xlsx
│   │   └── log.js                    ← auditoria na tabela logs
│   ├── supabaseClient.js             ← inicialização do cliente
│   ├── App.js                        ← rotas + AuthProvider
│   └── index.js
├── supabase_schema.sql               ← script SQL completo
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚡ Instalação rápida

### 1. Clone e instale dependências

```bash
git clone <seu-repo>
cd medcontrol
npm install
```

> Se usar fontes opcionais (Inter / DM Sans via @fontsource):
> ```bash
> npm install @fontsource/inter @fontsource/dm-sans
> ```
> Caso prefira não instalar, remova os imports de fontsource em `src/App.js`.

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:

```env
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
```

Obtenha os valores em **Supabase → Settings → API**.

### 3. Crie as tabelas no Supabase

No painel do Supabase, acesse **SQL Editor** e execute o conteúdo de `supabase_schema.sql`.

Isso cria:
- `usuarios` – perfis ligados ao `auth.users`
- `produtos` – medicamentos (CATMAT, lote, validade)
- `categorias` – classificação dos produtos
- `movimentacoes` – entradas, saídas e ajustes
- `logs` – auditoria de ações

### 4. Execute o projeto

```bash
npm start
```

Acesse **http://localhost:3000**

---

## 🔐 Perfis e permissões

| Recurso               | Estoque | Farmacêutico | Administrador |
|-----------------------|:-------:|:------------:|:-------------:|
| Ver dashboard         | ✓       | ✓            | ✓             |
| Ver produtos          | ✓       | ✓            | ✓             |
| Criar/editar produtos | –       | ✓            | ✓             |
| Registrar movimentação| –       | ✓            | ✓             |
| Gerar relatórios      | ✓       | ✓            | ✓             |
| Gerenciar usuários    | –       | –            | ✓             |

---

## 🗄️ Exemplo de CRUD com Supabase

```js
import { supabase } from './supabaseClient';

// CREATE
await supabase.from('produtos').insert({ nome: 'Dipirona', lote: 'L001', validade: '2025-12-31', quantidade: 100 });

// READ com join
const { data } = await supabase
  .from('produtos')
  .select('*, categorias(nome)')
  .eq('ativo', true)
  .order('nome');

// UPDATE
await supabase.from('produtos').update({ quantidade: 80 }).eq('id', 1);

// DELETE lógico (recomendado)
await supabase.from('produtos').update({ ativo: false }).eq('id', 1);
```

---

## 📦 Dependências principais

| Pacote                  | Uso                              |
|-------------------------|----------------------------------|
| `@supabase/supabase-js` | Auth, banco, RLS                 |
| `react-router-dom`      | Navegação SPA                    |
| `recharts`              | Gráficos de área, barra e pizza  |
| `xlsx`                  | Exportação Excel                 |
| `date-fns`              | Manipulação de datas             |

---

## 🚀 Build para produção

```bash
npm run build
```

A pasta `build/` pode ser hospedada em qualquer serviço estático:  
Vercel, Netlify, GitHub Pages, AWS S3, etc.

---

## 🔧 Variáveis de ambiente necessárias

| Variável                       | Descrição                          |
|--------------------------------|------------------------------------|
| `REACT_APP_SUPABASE_URL`       | URL do projeto Supabase            |
| `REACT_APP_SUPABASE_ANON_KEY`  | Chave pública anon do Supabase     |

> ⚠️ **Nunca** commite o arquivo `.env` — ele está no `.gitignore`.
