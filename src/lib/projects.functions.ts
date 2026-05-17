import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, initial_prompt, published, slug, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string; brief?: Record<string, string>; content: unknown; title?: string }) =>
    z.object({
      prompt: z.string().min(1),
      brief: z.record(z.string(), z.string()).optional(),
      content: z.any(),
      title: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        initial_prompt: data.prompt,
        brief: data.brief ?? {},
        content: data.content,
        title: data.title ?? "Nova VSL",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProjectContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; content: unknown; title?: string }) =>
    z.object({
      id: z.string().uuid(),
      content: z.any(),
      title: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const update: Record<string, unknown> = { content: data.content };
    if (data.title) update.title = data.title;
    const { error } = await supabase.from("projects").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
