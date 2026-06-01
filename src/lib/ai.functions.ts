import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VSL_SYSTEM_PROMPT = `És o motor de criação de VSL da feneion — um construtor visual completo no mesmo nível do GPT Engineer do Lovable.
Adaptas-te ao pedido do utilizador e geras estruturas de página de venda persuasivas em português europeu.

REGRAS DE COPYWRITING (CRÍTICO):
- VSLs NÃO são páginas de texto longo. Vídeo + 3 a 5 frases curtas + CTA. Menos é mais.
- Headline curta e impactante (máx 12 palavras), subheadline com 1 frase clara.
- "vslScript" devolve apenas 3 a 5 frases curtas (uma frase por elemento do array), nunca parágrafos longos.
- Cada "section.body" tem no máximo 2 frases. Bullets curtos (4 a 7 palavras).
- ZERO emojis, ZERO sparkles, ZERO clichés de IA ("revolução", "desbloqueia o teu potencial", "incrível jornada").
- Português europeu, tom direto e confiante.

FORMATOS POSSÍVEIS (campo "format"):
- "vsl": vídeo único + CTA (default).
- "quiz": perguntas de qualificação que terminam em CTA.
- "multi-video": vários vídeos em sequência.
- "long-form": página longa sem vídeo (raro, só se pedido).

MODO BUILDER — aplicas QUALQUER alteração pedida no JSON correto:
- "muda cor do botão para azul" -> style.accentColor = "#3b82f6"
- "redireciona o botão para /checkout" -> ctaLink
- "adiciona efeito pulsante no botão" -> ctaStyle.effect = "pulse" (opções: none, pulse, glow, bounce, shake)
- "botão maior" -> ctaStyle.size = "lg" (sm, md, lg, xl)
- "botão arredondado" -> ctaStyle.shape = "pill" | "rounded" | "square"
- "adiciona galeria de fotos" -> images = [{url, alt}, ...]
- "adiciona mais vídeos" -> videos = [{url, title}, ...]
- "muda fundo para imagem X" -> style.backgroundUrl
- "remove testemunho do João" -> testimonials filtrado
- "põe garantia de 30 dias" -> ajusta secção guarantee
- "esconde FAQ" -> faq = []
- "põe CTA no fim" -> ctaTiming = "end"

Devolves SEMPRE JSON válido, sem markdown, sem comentários.`;

const CtaStyleSchema = z.object({
  effect: z.enum(["none", "pulse", "glow", "bounce", "shake"]).optional(),
  size: z.enum(["sm", "md", "lg", "xl"]).optional(),
  shape: z.enum(["pill", "rounded", "square"]).optional(),
}).optional();

const VslSchema = z.object({
  title: z.string(),
  format: z.enum(["vsl", "quiz", "multi-video", "long-form"]).optional(),
  headline: z.string(),
  subheadline: z.string(),
  cta: z.string(),
  ctaLink: z.string().optional(),
  ctaTiming: z.enum(["start", "middle", "end", "always"]).optional(),
  ctaStyle: CtaStyleSchema,
  vslScript: z.array(z.string()),
  vslVideoUrl: z.string().optional(),
  videos: z.array(z.object({ url: z.string(), title: z.string().optional() })).optional(),
  images: z.array(z.object({ url: z.string(), alt: z.string().optional() })).optional(),
  quiz: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
  })).optional(),
  sections: z.array(z.object({
    type: z.enum(["problem", "solution", "benefits", "social-proof", "offer", "faq", "guarantee", "urgency"]),
    heading: z.string(),
    body: z.string(),
    bullets: z.array(z.string()).optional(),
  })),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  testimonials: z.array(z.object({
    name: z.string(),
    role: z.string(),
    quote: z.string(),
    avatarUrl: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
  })),
  style: z.object({
    palette: z.enum(["dark-premium", "fintech", "course", "dropshipping", "saas"]),
    accentColor: z.string(),
    backgroundUrl: z.string().optional(),
    backgroundColor: z.string().optional(),
  }),
});


export type VslContent = z.infer<typeof VslSchema>;

export const generateVsl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string; answers?: Record<string, string> }) =>
    z.object({
      prompt: z.string().min(5).max(2000),
      answers: z.record(z.string(), z.string()).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Cria uma VSL curta e direta (estilo página de vendas moderna: vídeo + poucas frases + CTA forte).

Produto/oferta do utilizador:
"${data.prompt}"

${data.answers ? `Detalhes adicionais:\n${Object.entries(data.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}` : ""}

Escolhe o "format" adequado. Mantém o copy ENXUTO. Devolve APENAS um objeto JSON (sem markdown):
{
  "title": "...",
  "format": "vsl",
  "headline": "máx 12 palavras",
  "subheadline": "1 frase clara",
  "cta": "Quero começar agora",
  "ctaLink": "",
  "ctaTiming": "end",
  "ctaStyle": { "effect": "pulse", "size": "lg", "shape": "pill" },
  "vslScript": ["frase 1", "frase 2", "frase 3"],
  "videos": [],
  "images": [],
  "quiz": [],
  "sections": [
    { "type": "problem", "heading": "...", "body": "máx 2 frases", "bullets": ["curto","curto","curto"] },
    { "type": "solution", "heading": "...", "body": "máx 2 frases" },
    { "type": "offer", "heading": "...", "body": "máx 2 frases", "bullets": ["...","...","..."] },
    { "type": "guarantee", "heading": "...", "body": "1 frase" }
  ],
  "faq": [{ "q": "...", "a": "1 a 2 frases" }],
  "testimonials": [{ "name": "...", "role": "...", "quote": "1 frase", "rating": 5 }],
  "style": { "palette": "dark-premium", "accentColor": "#8BC53F" }
}

Regras: 3-5 secções no máximo, 3-5 FAQs, 3 testemunhos curtos, 3-5 frases no vslScript. PT-PT. ZERO emojis. Copy curto e cirúrgico.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: VSL_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit atingido. Tenta novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos da IA esgotados. Adiciona créditos no Lovable.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);

    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("A IA devolveu JSON inválido");
    }
    return VslSchema.parse(parsed);
  });

const EditResponseSchema = z.object({
  summary: z.string(),
  vsl: VslSchema,
});

export const editVsl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { current: VslContent; instruction: string }) =>
    z.object({
      current: VslSchema,
      instruction: z.string().min(2).max(1000),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: VSL_SYSTEM_PROMPT },
          {
            role: "user",
            content: `MODO BUILDER. VSL atual em JSON:
${JSON.stringify(data.current)}

Instrução do utilizador: "${data.instruction}"

Aplica EXATAMENTE o pedido nos campos corretos do JSON (cores, links, efeitos do botão em ctaStyle.effect, timing, secções, testemunhos, imagens, vídeos, etc.). Se for ambíguo, faz a interpretação mais útil para conversão.

Devolve um único objeto JSON:
{
  "summary": "explicação curta (1-2 frases) do que mudaste",
  "vsl": { ...VSL completo atualizado... }
}

Regras: ZERO emojis. Apenas JSON. Mantém a estrutura completa do VSL.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit atingido. Tenta mais tarde.");
    if (res.status === 402) throw new Error("Créditos da IA esgotados.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");
    return EditResponseSchema.parse(JSON.parse(content));
  });
