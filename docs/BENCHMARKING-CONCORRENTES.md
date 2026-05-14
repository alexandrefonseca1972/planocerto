# Benchmarking de Concorrentes — Estrutura de Dados

Módulo para coleta e comparação de valores de mensalidades de instituições de ensino superior concorrentes.

## Visão Geral

```
Catálogos globais (admin write, all auth read):
  ├── modalidades          (Presencial, EAD, Semipresencial)
  ├── cursos_superiores    (Direito, Administração, Medicina...)
  └── turnos               (Matutino, Vespertino, Noturno, Integral)

Tabelas tenant-scoped:
  ├── instituicoes                 (concorrente: nome, CNPJ, grupo econômico...)
  ├── cursos_instituicao           (oferecimento: coordenador + FK curso/tipo/campus)
  ├── corpo_docente                (professor, titulação, Lattes, disciplina)
  └── mensalidades_concorrentes    (preço por modalidade/turno)
```

## Herança RLS

```
instituicoes ─── RLS direta: tenant_members OU is_admin()
     │
     ├──▶ cursos_instituicao ─── RLS via JOIN instituicoes.tenant_id
     │           │
     │           ├──▶ corpo_docente ─── RLS via JOIN cursos_instituicao → instituicoes
     │           │
     │           └──▶ mensalidades_concorrentes ─── RLS via JOIN cursos_instituicao → instituicoes
```

## Tabelas

### `modalidades`
Catálogo global de modalidades de ensino.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| name | TEXT UNIQUE | Presencial, EAD, Semipresencial |

### `cursos_superiores`
Catálogo global de cursos de graduação/pós.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| name | TEXT UNIQUE | Direito, Administração, Medicina... |

**Seed inicial (15 cursos):** Direito, Administração, Medicina, Enfermagem, Psicologia, Engenharia Civil, Engenharia de Produção, Ciências Contábeis, Pedagogia, Fisioterapia, Odontologia, Farmácia, Nutrição, Sistemas de Informação, Arquitetura e Urbanismo

### `turnos`
Catálogo global de turnos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| name | TEXT UNIQUE | Matutino, Vespertino, Noturno, Integral |

### `instituicoes`
Instituições de ensino superior concorrentes. Tenant-scoped.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| tenant_id | UUID FK→tenants | Tenant proprietário |
| nome | TEXT NOT NULL | Nome oficial da IES |
| nome_fantasia | TEXT | Marca (ex: "UniCesumar") |
| cnpj | TEXT | CNPJ da mantenedora |
| tipo | TEXT CHECK | Pública, Privada, Filantrópica |
| grupo_economico | TEXT | Grupo Ser, Kroton, Yduqs... |
| site | TEXT | Site institucional |
| unit_id | UUID FK→units | Cidade/campus de referência |

**Unique:** `(tenant_id, nome)`

### `cursos_instituicao`
Oferecimento de um curso em uma instituição. Representa a relação entre IES e curso, contendo dados de coordenação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| instituicao_id | UUID FK→instituicoes | IES |
| curso_id | UUID FK→cursos_superiores | Curso |
| tipo_pa_id | UUID FK→tipos_pa | Graduação, Pós-Graduação... |
| unit_id | UUID FK→units | Campus (se diferente da IES) |
| coordenador_nome | TEXT | **Opcional** — nome do coordenador |
| coordenador_email | TEXT | **Opcional** |
| coordenador_telefone | TEXT | **Opcional** |
| coordenador_lattes | TEXT | **Opcional** — URL Lattes |

### `corpo_docente`
Professores vinculados a um oferecimento de curso. Dados preenchidos conforme disponíveis no site da IES.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| curso_instituicao_id | UUID FK→cursos_instituicao | Vínculo com o curso |
| nome | TEXT NOT NULL | Nome do professor |
| titulacao | TEXT | Doutor, Mestre, Especialista |
| lattes_url | TEXT | `http://lattes.cnpq.br/...` |
| disciplina | TEXT | O que leciona |
| email | TEXT | **Opcional** |
| regime | TEXT | Integral, Parcial, Horista |

### `mensalidades_concorrentes`
Preços coletados. Registro histórico com vigência e fonte.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| curso_instituicao_id | UUID FK→cursos_instituicao | Curso na IES |
| modalidade_id | UUID FK→modalidades | Presencial, EAD... |
| turno_id | UUID FK→turnos | Matutino, Noturno... |
| valor | NUMERIC(12,2) > 0 | Valor da mensalidade |
| periodo | TEXT CHECK | mensal, semestral, anual |
| desconto | TEXT | Ex: "30% pontualidade" |
| vigencia_inicio | DATE NOT NULL | Início da vigência |
| vigencia_fim | DATE | NULL = ainda vigente |
| data_coleta | DATE | Quando o dado foi obtido |
| fonte | TEXT | site, edital, visita, aluno... |

## Migration

Arquivo: `supabase/migrations/045_competitor_benchmark.sql`

## Tipos TypeScript

Arquivo: `src/types/competitor.ts`
Atualização: `src/lib/supabase/database.types.ts`

## Permissões

- `COMPETITOR_READ` — visualizar dados de benchmarking
- `COMPETITOR_WRITE` — criar/editar instituições, cursos e mensalidades
