## Objetivo

Substituir o estado em memória (mock + useState) por persistência real no banco (Lovable Cloud), mantendo toda a UI e fluxos atuais funcionando.

## Escopo de dados a persistir

1. **Projetos** — cadastro, edição, listagem, filtros
2. **Membros do time** (vinculados a projetos)
3. **Relatórios semanais** (histórico completo + tópicos: highlights, blockers, inProgress, nextSteps, indicators, métricas)
4. **Profissionais** (perfil detalhado: skills, certificações, soft skills, histórico)
5. **Upload de planilha** continua funcionando, mas gravando no banco

## Acesso

Para manter a UX atual (sem tela de login), as tabelas ficarão com **acesso compartilhado autenticado-opcional**: leitura e escrita liberadas para `anon` e `authenticated`. Caso queira restringir por login depois, basta adicionar auth e ajustar RLS — aviso isso na entrega.

## Schema (migração SQL)

```text
projects
  id (uuid, pk)             name (text)            description (text)
  category (text)           type (text)            status (text)
  start_date (date)         end_date (date)        progress (int)
  tags (text[])             created_at / updated_at

team_members
  id (uuid, pk)             project_id (fk projects, cascade)
  name (text)               role (text)            seniority (text)
  avatar (text, null)

weekly_reports
  id (uuid, pk)             project_id (fk projects, cascade)
  week_start (date)         week_end (date)        status (text)
  summary (text)            highlights (text[])    blockers (text[])
  in_progress (text[])      next_steps (text[])    indicators (text[])
  tasks_completed/total (int)  incidents_resolved (int)
  deployments_count (int)   uptime_percent (numeric)
  created_at

professionals
  id (uuid, pk)             name (text, unique citext)
  role (text)               seniority (text)       resumo (text)
  soft_skills (text[])      certifications (text[])
  skills (jsonb)            project_history (jsonb)
```

Cada `CREATE TABLE` virá com `GRANT` para `anon`, `authenticated`, `service_role` e RLS habilitado com policies permissivas (leitura/escrita liberadas).

## Camada de dados (frontend)

- Novo `src/hooks/useProjects.ts` — carrega projects + team + weekly_reports, expõe `createProject`, `updateProject`, `addReport`, `bulkUpsert` (para upload).
- Novo `src/hooks/useProfessionals.ts` — CRUD de profissionais.
- Funções de mapeamento `db ↔ Project` em `src/lib/projectMapper.ts` (snake_case ↔ camelCase, agrupamento de team e reports).
- `src/pages/Index.tsx` passa a consumir os hooks (substitui `useState(mockProjects)`).
- `ProjectDetail`, `NewProjectModal`, `NewWeeklyReportModal`, `UploadModal` continuam recebendo callbacks; callbacks agora gravam via hooks.
- Loading skeleton enquanto carrega.

## Seed inicial

Após a migração, faço um seed automático com os dados de `mockProjects` e `mockProfessionals` para que o app não apareça vazio na primeira execução.

## Fora de escopo

- Tela de login / autenticação (pode ser adicionada depois)
- Edição inline de profissionais (continua via upload)
- Realtime sync entre abas

Posso prosseguir?