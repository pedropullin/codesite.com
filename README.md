# Vault Association — e-commerce imersivo

E-commerce premium da **Vault Association**, desenvolvido pela **CodeSite**. A home é uma
experiência 3D guiada pelo scroll; a loja inclui catálogo, página de produto, carrinho e checkout
com finalização via WhatsApp; o painel administrativo gerencia produtos, pedidos, clientes,
analytics e configurações — tudo ligado ao mesmo banco de dados.

## Como rodar

```bash
npm install
npm run dev
```

- Loja: http://localhost:3000
- Painel: http://localhost:3000/admin — `admin@vaultassociation.com` / `vault-admin`
  (troque em **Configurações → Conta** ou pelas variáveis `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

Na primeira requisição o banco SQLite (`./data/vault.db`) é criado, as migrations são aplicadas e
o catálogo é populado (4 categorias, 17 produtos, 62 variações). Por padrão também são gerados
~200 dias de pedidos, clientes e eventos de analytics de demonstração, para o dashboard não
nascer vazio. Eles podem ser apagados em **Configurações → Conta → Zona de perigo**.

| Script | O que faz |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js (Turbopack) |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:reset` | Recria o banco local com catálogo + demonstração (`-- --clean` para só o catálogo) |
| `npm run db:generate` | Gera uma nova migration a partir de `src/db/schema.ts` |
| `npm run render` | Re-renderiza as fotos de produto em `public/renders` (ver abaixo) |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Nenhuma é obrigatória em desenvolvimento.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Banco libSQL/Turso em produção. Vazio = `./data/vault.db` |
| `SEED_DEMO_DATA` | `false` para popular só o catálogo no primeiro boot |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin criado no primeiro boot |
| `SESSION_SECRET` | Assinatura da sessão do painel. Vazio = segredo aleatório salvo no banco |
| `NEXT_PUBLIC_SITE_URL` | URL pública (links de e-mail e Open Graph) |
| `RESEND_API_KEY`, `RESET_EMAIL_FROM` | Envio do e-mail de recuperação de senha |

## Arquitetura

```
src/
  app/(store)/          Loja: home, /shop, /product/[slug], /checkout, confirmação
  app/admin/            Login, recuperação de senha e painel (grupo (panel))
  app/api/track         Coleta de eventos de analytics (page/product view, carrinho)
  app/media/[id]        Imagens enviadas pelo painel (tabela MEDIA)
  components/home/      Hero 3D + seções editoriais da home
  components/admin/     UI do painel, gráficos, editores
  db/                   Schema Drizzle, cliente, seed
  lib/data/             Consultas e regras de negócio (server-only)
  three/                Modelos 3D procedurais, materiais, texturas e iluminação de estúdio
  proxy.ts              Proteção otimista das rotas /admin
scripts/render/         Pipeline que renderiza as fotos de produto a partir dos modelos 3D
drizzle/                Migrations SQL
```

**Stack:** Next.js 16 (App Router, Server Actions, `<ViewTransition>`), React 19, Tailwind CSS 4,
three.js + React Three Fiber, Motion, Lenis, Drizzle ORM + libSQL, jose, zod.

### Banco de dados

Tabelas: `users`, `categories`, `products`, `product_variants`, `customers`, `orders`,
`order_items`, `order_status_history`, `analytics_events`, `store_settings` e `media`.

- Produto → categoria (N:1); produto → variações tamanho × cor com estoque próprio (1:N).
- Pedido → cliente (N:1, cliente criado/atualizado pelo e-mail no checkout); pedido → itens
  (snapshot de nome, SKU, variação e preço) e histórico de status.
- O checkout roda em transação: valida estoque, grava o pedido e **decrementa o estoque** de
  forma atômica. Cancelar um pedido devolve os itens ao estoque; reativá-lo retira novamente.
- Analytics vem de eventos reais: visitas, visualizações de produto, adições ao carrinho,
  início de checkout e compras. Bots/headless são ignorados.
- Configurações (marca, contato, hero, textos, banners, destaques) ficam em `store_settings`
  e são validadas com zod. Toda gravação do painel revalida a loja na hora.

### Experiência 3D

O hero tem cinco etapas controladas pelo scroll (`src/components/home/hero/stages.ts`):
objeto → forma (giro de 90°, câmera lateral, anotações) → interior (mais 90°, a tampa abre e os
objetos flutuam) → foco (a câmera atravessa os objetos e a tag assume o centro) → coleção (a
caixa diminui para a lateral e a tag se transforma no primeiro card de produto).

- O mouse inclina o objeto até ~5° e ele volta sozinho quando o cursor para; no celular, a
  orientação do aparelho e a velocidade do scroll fazem esse papel.
- Níveis de qualidade automáticos: **high** (desktop, 8 objetos, sombras de contato),
  **medium** (tablet, 6 objetos) e **low** (celular/GPU fraca, 4 objetos, geometria e texturas
  mais leves). Sem WebGL, entra um fallback 2.5D em CSS com a mesma narrativa. Para testar:
  `/?tier=high|medium|low|none`.
- O canvas é carregado sob demanda, compila os shaders antes de aparecer e pausa quando o hero
  sai da tela.

### Fotos de produto

As imagens em `public/renders` são renders de estúdio gerados a partir dos mesmos modelos 3D
procedurais da home (`src/three/models`), feitos com Chromium headless e comprimidos em WebP.
São placeholders consistentes com a identidade: substitua pelas fotos reais pelo painel
(**Produtos → Editar → Imagens**, com compressão automática no navegador). Para regerar:

```bash
npm run render            # todas as imagens
npm run render -- runner  # só as que contêm "runner"
```

## Deploy (Vercel + Turso)

1. Crie um banco em [Turso](https://turso.tech) e defina `DATABASE_URL` e `DATABASE_AUTH_TOKEN`.
2. Defina `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `NEXT_PUBLIC_SITE_URL`.
3. Faça o deploy. As migrations e o seed rodam na primeira requisição.

Sem `DATABASE_URL` na Vercel o app usa um SQLite temporário em `/tmp`, que é zerado a cada cold
start e não é compartilhado entre instâncias — serve apenas para preview.
