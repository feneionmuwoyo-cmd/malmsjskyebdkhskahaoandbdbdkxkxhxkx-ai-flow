## Visão geral

São mudanças grandes. Vou dividir em **4 fases** para entregar com qualidade. Cada fase é independente e testável. Confirma e começo pela Fase 1.

---

### Fase 1 — Estrutura base (dashboard + workspace limpos + tema)

**Dashboard com sidebar**
- Remover botões "Dashboard" e "Sair" da Header do dashboard.
- Novo `AppSidebar` (shadcn) à esquerda com:
  - Lista de **projetos** (rolável, com botão + para novo).
  - Rodapé com **avatar do utilizador** → menu dropdown: *Editar perfil*, *Notificações* (com badge), *Assinar plano*, *Sair*.
- Conteúdo principal do dashboard: **apenas um grande campo de prompt** (estilo Lovable home). Ao submeter → cria projeto + redireciona para `/workspace/$id?prompt=...`.

**Workspace limpo**
- Atualmente o preview aparece por baixo do chat em mobile/colunas. Vou fixar **layout 100vh, sem scroll exterior**: chat à esquerda (largura fixa), preview ocupa o resto. Nada por baixo do chat — área de input fica colada ao fundo do painel.
- Botão **"Preview"** (abrir em nova aba) confirmado a funcionar — vou validar a rota `/preview/$id` e RLS.

**Tema claro/escuro**
- Toggle no avatar menu. Tokens já estão em `src/styles.css` em `oklch` — só falta a classe `.light` e o switch. Não vai mexer no design atual (modo escuro continua default).

**Landing clean**
- Remover sparkles/emojis decorativos (✨, 🚀, etc.) dos componentes da landing.

---

### Fase 2 — IA verdadeiramente capaz (não só trocar texto)

**Problema atual:** o schema `VslContent` é texto puro. A IA não consegue trocar cores, links ou comportamentos porque o modelo de dados não os representa.

**Solução — schema rico (`VslContentV2`):**
```ts
{
  theme: { primary, accent, background, font, radius },
  sections: [
    { id, type: "hero"|"vsl"|"bullets"|"cta"|"testimonials"|"faq"|"quiz"|"checkout",
      visible: boolean,
      order: number,
      props: { ...campos específicos do tipo, incluindo cor do botão, link de destino, etc. }
    }
  ]
}
```

- A IA passa a receber este JSON e pode: trocar cor de qualquer botão, mudar destino de um link, esconder/mover secções, adicionar nova secção, mudar fonte/raio global.
- Prompt do sistema reescrito com exemplos completos.
- **Chat estilo Lovable**: além das frases de pensamento, mostrar **o que está a alterar** ("a mudar a cor do botão principal", "a esconder a secção de FAQ", "a adicionar urgência no hero") — vou usar streaming com etapas reais devolvidas pelo modelo.

**Quiz médio quando a IA tem dúvidas**
- Se o modelo devolver `needs_clarification: [{question, options}]`, abre um **Dialog pequeno** (não tela cheia) com as perguntas uma a uma. Resposta volta no contexto.

**Dashboard → Workspace com prompt**
- Ao escrever no dashboard e enviar, vai direto para o workspace, primeira mensagem já no chat, IA processa imediatamente. Se entender → implementa. Se não → abre o dialog de quiz.

---

### Fase 3 — Vídeos + Template Quiz + Pagamento Express

**Upload de vídeos**
- Novo bucket Supabase `vsl-videos` (privado, com policy: dono lê/escreve).
- Componente `VideoPicker` com 3 tabs:
  - **Galeria** (upload local → Supabase Storage, máx 100MB).
  - **YouTube** (cola URL, faz embed `<iframe>`).
  - **Google Drive** (cola URL pública, faz embed via `/preview`).
- Substitui o placeholder atual de vídeo no `VslPreview`.

**Template novo: "Quiz → VSL → Checkout"**
- 3 ecrãs sequenciais dentro de uma VSL:
  1. Quiz com 3-5 perguntas (configuráveis).
  2. Vídeo de venda.
  3. Checkout Express.
- Disponível em `templates.ts` ao lado dos existentes.

**Pagamento Express (Kz, sem Stripe)**
- Tabela nova `payment_settings` (por projeto): `iban`, `nome_titular`, `telefone`, `montante`, `instrucoes`.
- Tabela nova `customer_orders`: `project_id`, `nome_cliente`, `telefone_cliente`, `comprovativo_url`, `status` (pendente/confirmado), `created_at`.
- Bucket `payment-proofs` (privado).
- Toggle "Ativar pagamento Express" em **qualquer template** — adiciona a secção de checkout.
- Formulário público para o cliente final: nome, telefone, upload de comprovativo (imagem ou PDF) → grava em `customer_orders`.

---

### Fase 4 — Analytics + Publicação + Notificações/Planos reais

**Analytics do criador**
- Tabela `project_views` (anonymous insert): conta visualizações da VSL pública.
- No dashboard do projeto, novo separador **"Resultados"**:
  - Total de visitas
  - Total de pedidos
  - Total pagos (confirmados)
  - Lista de clientes (nome, telefone, comprovativo) com botão *Confirmar pagamento*.

**Publicação com link copiável**
- Ao publicar, mostrar dialog com **URL pública da VSL** + botão "Copiar link" (já funcional). URL: `<dominio>/v/<slug>`.

**Notificações reais**
- Tabela `notifications` (`user_id`, `type`, `title`, `body`, `read`, `created_at`).
- Trigger automático: novo pedido na VSL → notificação para o dono.
- Dropdown no sidebar mostra não-lidas com badge.

**Planos (Kz)**
- Tabela `plans` (seed: Grátis, Pro, Business) e `user_subscriptions`.
- Página `/billing` com cards de planos.
- **Sem gateway** — utilizador clica "Assinar" → cria `customer_orders` interno para o admin processar manualmente (mesmo fluxo Express). Quando confirmado, ativa o plano. Sem Stripe/Paddle.

---

## Detalhes técnicos

- **Backend**: tudo em `createServerFn` (TanStack), nada de Edge Functions.
- **RLS**: cada tabela nova com policies "dono lê/escreve". `customer_orders` permite *insert público* (cliente final não tem conta) mas *select* só pelo dono do projeto.
- **Storage**: `vsl-videos` e `payment-proofs` privados com signed URLs para visualização pelo dono.
- **Tema**: `next-themes` (já estilo shadcn) ou implementação manual com `localStorage` + classe `.light` no `<html>`.
- **Quiz dialog**: componente `<ClarificationDialog>` baseado em `shadcn/dialog`, centrado e pequeno (max-w-md).
- **Migrações**: 1 migração por fase (3-4 migrações no total).

---

## Ordem de entrega proposta

| Fase | Esforço | Entrega |
|---|---|---|
| 1 | Médio | Dashboard com sidebar, workspace limpo, tema, landing sem emojis |
| 2 | Alto | IA poderosa + chat com etapas reais + quiz de dúvidas |
| 3 | Alto | Vídeos + template Quiz + pagamento Express |
| 4 | Médio | Analytics + publicação + notificações + planos |

**Lovable AI**: continuo a usar `google/gemini-3-flash-preview` (default). Para a Fase 2 (schema rico) pode valer a pena `google/gemini-3.1-pro-preview` por causa do raciocínio — confirma se posso.

**Leaked password protection**: ✅ ativa essa opção no painel do Supabase Auth (Settings → Auth → Password Protection) — eu não consigo ativar isso por código.

Aprovas o plano e começo pela **Fase 1**?