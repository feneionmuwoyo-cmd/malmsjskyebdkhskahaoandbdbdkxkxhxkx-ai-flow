## Ordem de execução

Divido em **3 entregas** para garantir qualidade. Cada uma é testável de forma independente.

---

### Entrega A — Correções UX urgentes + SEO (faço agora)

Mudanças pequenas e isoladas, baixo risco:

1. **Landing mais clara no centro** — adicionar gradiente verde radial subtil atrás do `<h1>` em `src/routes/index.tsx`.
2. **Login mobile não força quiz** — `src/routes/login.tsx` redireciona sempre para `/dashboard` (nunca para `/onboard`).
3. **Botão "Voltar ao dashboard"** no topo do `src/routes/workspace.$id.tsx`.
4. **Histórico de versões** — nova tabela `project_versions` (snapshot do `content` a cada edit da IA) + botão "Desfazer" no chat que reverte para a versão anterior.
5. **Upload de vídeo no preview/visual edit** — botão "Carregar vídeo" dentro do `VslPreview` quando o projeto não está publicado; abre `VideoPicker` (Galeria/YouTube/Drive) e grava `vslVideoUrl` no content.
6. **SEO completo**:
   - `head()` por rota com `title`, `description`, `og:*` únicos em `/`, `/login`, `/dashboard`, `/billing`, `/notifications`, `/profile`.
   - `public/robots.txt` + `src/routes/sitemap[.]xml.ts` dinâmico.
   - JSON-LD `Organization` no `__root.tsx` e `WebSite` na home.
   - `llms.txt` em `public/` para assistentes IA.
   - Canonical apenas em folhas.

**Google Search Console**: não posso verificar sem o utilizador (tem de aprovar). No fim da entrega, dou as instruções para clicar e verificar o domínio.

---

### Entrega B — Fase 2: IA verdadeiramente capaz

Esta é a fase grande. Faço **depois** da Entrega A estar validada porque toca em todo o pipeline IA.

1. **Schema `VslContentV2`** com `theme` (cores, fonte, raio) e `sections[]` com `props` editáveis (cor de botão, link de destino, visibilidade, ordem).
2. **Migração de compatibilidade**: `VslPreview` lê V1 ou V2.
3. **Novo `editVsl` em streaming** (`createServerFn` com `async function*`) — devolve etapas reais: `{ type: "thinking", text }`, `{ type: "action", text: "a mudar a cor do botão CTA" }`, `{ type: "patch", ops: [...] }`, `{ type: "done" }`.
4. **Chat workspace** mostra cada etapa em tempo real (estilo Lovable).
5. **`ClarificationDialog`** — quando a IA devolve `needs_clarification`, abre um pequeno dialog modal com a pergunta. Resposta volta no contexto.
6. **Prompt do sistema reescrito** com exemplos de operações: mudar cor, esconder secção, reordenar, mudar link, mudar fonte, adicionar secção nova.
7. **Upload de imagens/vídeos no chat** — input com paperclip, envia URL no contexto da IA ("usa esta imagem como hero").

---

### Entrega C — Fases 3 e 4 condensadas

1. **Vídeos**: bucket `vsl-videos`, `VideoPicker` (já feito na Entrega A integrado no preview, aqui também no chat).
2. **Template Quiz→VSL→Checkout** em `src/data/templates.ts`.
3. **Pagamento Express (Kz)**: tabelas `payment_settings` + `customer_orders`, bucket `payment-proofs`, toggle por projeto, formulário público para cliente final.
4. **Analytics**: tabela `project_views`, separador "Resultados" no projeto (visitas, pedidos, confirmados, lista de clientes).
5. **Notificações reais**: tabela `notifications` + trigger ao criar pedido + badge no sidebar.
6. **Planos (Kz, sem Stripe)**: tabela `plans` (Grátis/Pro/Business) + `user_subscriptions`. Assinatura = `customer_orders` interno processado manualmente.
7. **Publicação**: dialog com URL `/v/<slug>` + botão copiar (já existe a base).

---

## Detalhes técnicos importantes

- Tudo em `createServerFn` (TanStack), nada de Edge Functions.
- Streaming IA com `async function*` e `for await` no cliente.
- RLS em todas as tabelas novas. `customer_orders` permite INSERT público mas SELECT só do dono.
- `payment-proofs` e `vsl-videos` são buckets **privados** com signed URLs.
- SEO: per-route `head()` em TanStack Start, canonical só em folhas (TanStack/router#6719).
- Histórico de versões: limito a 20 snapshots por projeto para não inchar.

---

## Pedido de confirmação

Confirmas que faço **Entrega A agora** (UX + SEO) e depois passo para B (IA capaz)? Se preferires arrancar pela IA diretamente, diz.
