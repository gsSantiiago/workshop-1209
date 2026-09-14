# Fake ERP

ERP de aula para traders/contractors. O repositório existe para a turma desenvolver software com IA — um domínio fechado, linguagem única e arquitetura pequena o bastante para caber na cabeça.

O loop do negócio: um **Item** é comprado, a quantidade vive num **Warehouse**, a quantidade sai para um **Job**. As únicas roles são **Administrator** e **Operator**.

A linguagem do domínio está em [`CONTEXT.md`](CONTEXT.md). Termos de negócio são em inglês no código, na API e na UI. Sem sinônimos em português.

## Stack

Monorepo Bun (`apps/*`):

| Camada | Tecnologia |
| --- | --- |
| Web | Vite + React 19 + TypeScript |
| API | Bun + Fastify 5 |
| Persistência | Drizzle ORM + SQLite (`bun:sqlite`) |
| Sessão | cookie + `@fastify/session` |
| Testes da API | `bun:test` + Sinon |
| DI | container caseiro, classes concretas, sem interfaces |

## Como rodar

Precisa do [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

- Web: http://localhost:5173
- API: http://localhost:3000
- Health: `GET /health`

O Vite encaminha `/api` e `/health` para a API. A sessão viaja no cookie `sessionId`.

Login inicial (seed quando a tabela `users` está vazia):

- email: `admin@local`
- senha: `admin`

Apps isoladas:

```sh
bun run dev:api
bun run dev:web
```

Testes da API:

```sh
bun test --cwd apps/api
```

Schema e banco:

```sh
bun run --cwd apps/api db:push
bun run --cwd apps/api db:studio
```

O SQLite de desenvolvimento fica em `apps/api/data/dev.sqlite` (fora do git). Variáveis em `apps/api/.env.example`.

## Arquitetura

```
apps/
  api/src/
    routes/          HTTP
    services/        regras e status HTTP
    repositories/    SQL via Drizzle
    container/       DI
    db/              schema, seed, client
    middleware/      auth + erros
  web/src/           uma tela React, fetch contra /api
```

### Caminho de um request

`routes/` → `services/` → `repositories/`, no mesmo nível. O próximo recurso copia esse trio.

1. A rota lê o body/params e chama o service.
2. O service valida, aplica a regra e lança `Error` com `statusCode` quando o resultado muda.
3. O repository só persiste. Não tem suite própria.

Exemplo: `POST /api/items` entra em `routes/items.ts`, o `ItemService` exige SKU/name/unit e mapeia unique violation para `409`, o `ItemRepository` faz o `insert`.

### HTTP

- Domínio sob `/api/...`
- Health em `GET /health` (público)
- Login em `POST /api/login` (público)
- O resto exige sessão (`401` sem cookie)
- Erro: o service lança `Error` com `statusCode`; o middleware responde `{ error, statusCode }`
- Sem hierarquia de classes de erro

Contrato típico: `200 []`, `201`, `400`, `409`, `204`, `404`.

### DI

Container caseiro em `apps/api/src/container/`. Tokens string, factories, instâncias em cache. O service recebe a classe concreta do repository.

Nos testes de service: `sinon.createStubInstance(ItemRepository)` — nunca `new ItemRepository`. Antes de um segundo `createServer()`, `container.clear()`. Sem isso: `Already registered`.

### Web

Uma app React em `apps/web`. Telas no mesmo `App.tsx`: Catalog, Warehouse, Job, Stock, Inventory, Procurement, Users. Estado local + `fetch` com `credentials: 'include'`. Sem suite Playwright no git.

## Domínio

Quantidade não mora no Item nem no Job. Só **Movement** escreve **Stock**. **Purchase** pede quantidade; o **Receipt** dessa Purchase é que entra no Warehouse.

| Termo | Significado |
| --- | --- |
| Item | Material no Catalog. Existe mesmo com quantidade zero. |
| Catalog | Lista mestre de Items. Sem saldo. |
| SKU | Código único e estável do Item. |
| Warehouse | Depósito. A quantidade vive aqui. |
| Stock | Quantidade de um Item em um Warehouse. |
| Job | Canteiro. Não é Warehouse. Não segura quantidade. |
| Movement | Receipt, Transfer ou Issue. Nada mais escreve Stock. |
| Purchase | Pedido de um Item, uma quantidade, um Warehouse, um Supplier. Não escreve Stock. |
| Receipt | Quantidade entrando num Warehouse. |
| Transfer | Quantidade de um Warehouse para outro. |
| Issue | Quantidade saindo de um Warehouse para um Job. |
| User / Role | Quem entra. Administrator ou Operator. |

Glossário completo e o que evitar: [`CONTEXT.md`](CONTEXT.md).

## O que já existe

Fechado no [`ROADMAP.md`](ROADMAP.md):

- Catalog — Item, SKU, Unit
- Warehouse e Stock
- Identity — User e Role
- Job
- Inventory — Receipt, Transfer, Issue
- Procurement — Supplier, Purchase, Receipt a partir da Purchase

Próximo: Staff e Assignment, depois Requisition.

Fora de escopo: financeiro, folha, BOQ, RFQ, subcontrato, equipamento, CRM, qualidade e segurança.

## Testes que ficam no repo

`bun:test` na API. Um integration verde não substitui a suite do service.

| Camada | O que prova | Como |
| --- | --- | --- |
| Service | todo ramo que muda o resultado | unit, stub do repository, sem IO |
| Route + DB | contrato HTTP e o índice unique | `createServer()` + `fastify.inject()` + SQLite real |
| Repository sozinho | nada | sem suite própria |
| Web | nada no git | Playwright no fim da mudança, via MCP |

## Documentos

| Arquivo | Para quê |
| --- | --- |
| [`CONTEXT.md`](CONTEXT.md) | Linguagem do domínio |
| [`ROADMAP.md`](ROADMAP.md) | Fatias feitas e as próximas |
| [`AGENTS.md`](AGENTS.md) | Contrato da arquitetura e dos testes para o agente |
