# Trabalho-de-Conclus-o-de-Curso---App-web
TCC em Sistemas de Informação — app web de planejamento alimentar semanal com React, Node.js, Prisma/SQLite e algoritmo genético (IA simulada). Projeto acadêmico.

# Nutri Semana — Planejamento alimentar inteligente (TCC)

> **Trabalho de Conclusão de Curso (TCC)** em **Sistemas de Informação** — aplicação web full stack para geração de **plano alimentar semanal** personalizado, com interface responsiva e motor de recomendação baseado em regras nutricionais e **algoritmo genético**.

**Autor:** Andre Henrique e Matheus Henrique

**Natureza do projeto:** acadêmico / protótipo funcional  
**Licença de uso:** consulte o autor antes de uso comercial

---

## Sobre o projeto

Este repositório contém o sistema desenvolvido para o TCC: uma plataforma em que o usuário informa perfil (idade, peso, objetivo, restrições, orçamento e preferências) e o sistema gera um **cardápio da semana**, com **macros**, **lista de compras**, **estimativa de custo** e **textos explicativos** por refeição.

O foco do trabalho inclui:

- Arquitetura **cliente–servidor** (React + API REST)
- **Responsividade mobile-first**
- **Segurança** (JWT, bcrypt, consentimento LGPD no cadastro)
- **Sistema de apoio à decisão** com TMB/TDEE e otimização heurística (algoritmo genético)

> **Nota acadêmica:** o projeto utiliza **“IA simulada”** — não emprega modelos de linguagem nem *machine learning* treinado. A recomendação é feita por fórmulas nutricionais codificadas e algoritmo evolutivo com função de *fitness* explícita.

> **Aviso:** esta aplicação **não substitui** acompanhamento de nutricionista ou médico. É uma ferramenta educacional e de apoio ao planejamento.

---

## Funcionalidades

### Usuário
- Cadastro e login (e-mail ou usuário)
- Perfil nutricional editável
- Geração de plano alimentar semanal (7 dias)
- Visualização de calorias e macronutrientes por refeição
- Marcar refeições como concluídas
- Sugestão de substituição de alimentos
- Lista de compras com custo estimado
- Exportação em PDF

### Administrador
- Painel com estatísticas
- Gestão de usuários e alimentos (CRUD)
- Inspeção somente leitura do banco (sem expor senhas)

---

## Stack tecnológica

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React, Vite, TailwindCSS, React Router, Lucide React, pdfmake |
| Backend | Node.js, Express, Zod |
| Banco | SQLite + Prisma ORM |
| Autenticação | JWT + bcrypt |
| Monorepo | npm workspaces |

---

## Como executar

### Pré-requisitos
- **Node.js 18+** (recomendado 20+)
- **npm**

### Instalação (máquina nova)

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd tcce

# 2. Configure o ambiente (Windows)
copy backend\.env.example backend\.env

# Linux/macOS:
# cp backend/.env.example backend/.env

# 3. Instale dependências e prepare o banco
npm install
npm run db:push
npm run db:seed

# 4. Inicie frontend + backend
npm run dev
```

### Acessos

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3100/api |
| Health check | http://localhost:3100/api/health |

A porta da API pode ser alterada em `backend/.env` (`PORT=3100`).

### Usuário administrador (após seed)

| Campo | Valor |
|-------|--------|
| Usuário | `admin` |
| E-mail | `admin@fepi.edu.br` |
| Senha | `Admin123!` |

---

## Estrutura do repositório

```
tcce/
├── frontend/          # Interface React (SPA)
├── backend/           # API Express + Prisma + motor de dieta
├── METODOLOGIA.md     # Metodologia do TCC
├── DIAGRAMAS.md       # Casos de uso e diagrama ER (Mermaid)
├── FORMULARIO_AVALIACAO_TCC.md  # Questionário para avaliação com usuários
└── README.md
```

---

## API (principais rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/register` | Cadastro |
| POST | `/api/login` | Login |
| GET/PATCH | `/api/me` | Perfil do usuário |
| POST | `/api/generate-diet` | Gerar plano alimentar |
| GET | `/api/diet` | Obter plano atual |
| GET | `/api/shopping-list` | Lista de compras |
| POST | `/api/substitute` | Substituir alimento |
| GET | `/api/admin/*` | Rotas administrativas |

---

## Algoritmo de recomendação (resumo)

1. **TMB** — fórmula de Mifflin-St Jeor  
2. **TDEE** — TMB × fator de atividade  
3. **Meta calórica** — ajuste por objetivo (perder / manter / ganhar peso)  
4. **Macronutrientes** — distribuição 25% proteína, 50% carboidrato, 25% gordura  
5. **Algoritmo genético** — otimiza aderência calórica, custo semanal e variedade  
6. **Explicabilidade** — cada refeição inclui justificativa textual  

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe frontend e backend em desenvolvimento |
| `npm run build` | Build de produção do frontend |
| `npm run start -w backend` | Inicia apenas a API |
| `npm run db:push` | Sincroniza schema Prisma com o SQLite |
| `npm run db:seed` | Popula alimentos e usuário admin |

---

## Contato e citação

Se utilizar este código em trabalhos acadêmicos, cite o autor e o contexto de TCC.

**Andre Henrique e Matheus Henrique** — Sistemas de Informação (TCC)

---

*Projeto acadêmico. Desenvolvido para fins de aprendizado, avaliação e demonstração de arquitetura de software aplicada à área de saúde/nutrição.*    
