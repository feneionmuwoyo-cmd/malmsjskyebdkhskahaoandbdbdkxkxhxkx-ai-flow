import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VSL_SYSTEM_PROMPT = `És um copywriter e estrategista de páginas de vendas de alta conversão.
Adaptas-te ao que o utilizador pede: VSL clássica, quiz interativo, sequência de vídeos, página long-form ou checkout direto.
Defines o campo "format" consoante o pedido: "vsl" (vídeo único), "quiz" (perguntas que levam ao CTA), "multi-video" (vários vídeos em sequência), "long-form" (texto longo sem vídeo).
Geras conteúdo em português europeu, persuasivo, claro e sem clichés de IA.
NUNCA uses emojis, ícones decorativos ou caracteres como sparkles, fogo, diamantes.
Devolves SEMPRE JSON válido seguindo exatamente a estrutura pedida.
Quando o utilizador pede alterações específicas (cor de botão, link de redirecionamento, posição do CTA, trocar fundo, eliminar testemunho, alterar timing) APLICAS exatamente o que foi pedido nos campos certos do JSON.`;


const VslSchema = z.object({
  title: z.string(),
  format: z.enum(["vsl", "quiz", "multi-video", "long-form"]).optional(),
  headline: z.string(),
  subheadline: z.string(),
  cta: z.string(),
  ctaLink: z.string().optional(),
  ctaTiming: z.enum(["start", "middle", "end", "always"]).optional(),
  vslScript: z.array(z.string()),
  vslVideoUrl: z.string().optional(),
  videos: z.array(z.object({ url: z.string(), title: z.string().optional() })).optional(),
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

    const userPrompt = `Cria uma VSL/página de vendas completa.

Produto/oferta do utilizador:
"${data.prompt}"

${data.answers ? `Detalhes adicionais:\n${Object.entries(data.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}` : ""}

Escolhe o "format" adequado ao pedido (vsl, quiz, multi-video, long-form) e adapta a estrutura.

Devolve APENAS um objeto JSON (sem markdown):
{
  "title": "...",
  "format": "vsl",
  "headline": "...",
  "subheadline": "...",
  "cta": "...",
  "ctaLink": "https://... (opcional)",
  "ctaTiming": "end (start|middle|end|always)",
  "vslScript": ["..."],
  "videos": [{ "url": "...", "title": "..." }],
  "quiz": [{ "question": "...", "options": ["...", "..."] }],
  "sections": [
    { "type": "problem", "heading": "...", "body": "...", "bullets": ["..."] },
    { "type": "solution", "heading": "...", "body": "..." },
    { "type": "benefits", "heading": "...", "body": "...", "bullets": ["..."] },
    { "type": "offer", "heading": "...", "body": "...", "bullets": ["..."] },
    { "type": "guarantee", "heading": "...", "body": "..." },
    { "type": "urgency", "heading": "...", "body": "..." }
  ],
  "faq": [{ "q": "...", "a": "..." }],
  "testimonials": [{ "name": "...", "role": "...", "quote": "...", "rating": 5 }],
  "style": { "palette": "dark-premium", "accentColor": "#8BC53F" }
}

Regras: usa format="quiz" só se o utilizador pediu quiz; "multi-video" se pediu vários vídeos. 6-8 secções, 5-8 FAQs, 3-4 testemunhos com rating 4-5, 4-6 parágrafos no script. PT-PT. ZERO emojis.`;

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
            content: `VSL atual (JSON):
${JSON.stringify(data.current)}

Instrução do utilizador: "${data.instruction}"

Devolve um único objeto JSON com esta estrutura:
{
  "summary": "explicação curta em português (1-3 frases) do que mudaste e porquê",
  "vsl": { ...VSL completo atualizado com a mesma estrutura... }
}

Regras: ZERO emojis. Apenas JSON. Mantém a estrutura completa do VSL.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");
    return EditResponseSchema.parse(JSON.parse(content));
  });
