import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VSL_SYSTEM_PROMPT = `És um copywriter especialista em VSLs e páginas de vendas de alta conversão.
Geras conteúdo em português europeu, persuasivo, claro e sem clichés de IA.
NUNCA uses emojis, ícones decorativos ou caracteres como ✨, 🔥, 💎.
Devolves SEMPRE JSON válido seguindo exatamente a estrutura pedida.`;

const VslSchema = z.object({
  title: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  cta: z.string(),
  vslScript: z.array(z.string()),
  vslVideoUrl: z.string().optional(),
  sections: z.array(z.object({
    type: z.enum(["problem", "solution", "benefits", "social-proof", "offer", "faq", "guarantee", "urgency"]),
    heading: z.string(),
    body: z.string(),
    bullets: z.array(z.string()).optional(),
  })),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  testimonials: z.array(z.object({ name: z.string(), role: z.string(), quote: z.string() })),
  style: z.object({
    palette: z.enum(["dark-premium", "fintech", "course", "dropshipping", "saas"]),
    accentColor: z.string(),
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

Devolve APENAS um objeto JSON com esta estrutura exata (sem markdown, sem \`\`\`):
{
  "title": "título curto do projeto",
  "headline": "headline principal poderosa",
  "subheadline": "subheadline que reforça o benefício",
  "cta": "texto do botão principal",
  "vslScript": ["parágrafo 1 do script de vídeo", "parágrafo 2", "..."],
  "sections": [
    { "type": "problem", "heading": "...", "body": "...", "bullets": ["..."] },
    { "type": "solution", "heading": "...", "body": "..." },
    { "type": "benefits", "heading": "...", "body": "...", "bullets": ["..."] },
    { "type": "offer", "heading": "...", "body": "...", "bullets": ["..."] },
    { "type": "guarantee", "heading": "...", "body": "..." },
    { "type": "urgency", "heading": "...", "body": "..." }
  ],
  "faq": [{ "q": "...", "a": "..." }],
  "testimonials": [{ "name": "...", "role": "...", "quote": "..." }],
  "style": { "palette": "dark-premium", "accentColor": "#8BC53F" }
}

Regras: 6-8 secções, 5-8 FAQs, 3-4 testemunhos realistas, 4-6 parágrafos no vslScript. Tudo em português europeu. ZERO emojis.`;

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
            content: `VSL atual (JSON):\n${JSON.stringify(data.current)}\n\nInstrução do utilizador: "${data.instruction}"\n\nDevolve o JSON completo atualizado, com a mesma estrutura. ZERO emojis. Apenas JSON.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");
    return VslSchema.parse(JSON.parse(content));
  });
