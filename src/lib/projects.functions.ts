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
  .inputValidator((input: { id: string; content: unknown; title?: string; snapshot?: boolean }) =>
    z.object({
      id: z.string().uuid(),
      content: z.any(),
      title: z.string().optional(),
      snapshot: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing, error: e1 } = await supabase
      .from("projects")
      .select("published, content, title")
      .eq("id", data.id)
      .single();
    if (e1) throw new Error(e1.message);
    if (existing?.published) throw new Error("Projeto publicado — não pode ser editado");

    // Snapshot current state before overwriting (for undo)
    if (data.snapshot && existing) {
      await supabase.from("project_versions").insert({
        project_id: data.id,
        user_id: userId,
        content: existing.content as never,
        title: existing.title,
      });
      // Keep only latest 20 versions
      const { data: olds } = await supabase
        .from("project_versions")
        .select("id")
        .eq("project_id", data.id)
        .order("created_at", { ascending: false })
        .range(20, 100);
      if (olds && olds.length > 0) {
        await supabase.from("project_versions").delete().in("id", olds.map(o => o.id));
      }
    }

    const { error } = await supabase
      .from("projects")
      .update({
        content: data.content as never,
        ...(data.title ? { title: data.title } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revertLastVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: versions, error } = await supabase
      .from("project_versions")
      .select("id, content, title")
      .eq("project_id", data.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    if (!versions || versions.length === 0) throw new Error("Sem versões anteriores");
    const v = versions[0];
    const { error: upErr } = await supabase
      .from("projects")
      .update({ content: v.content as never, ...(v.title ? { title: v.title } : {}) })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);
    await supabase.from("project_versions").delete().eq("id", v.id);
    return { content: v.content, title: v.title };
  });

export const hasVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { count } = await supabase
      .from("project_versions")
      .select("id", { count: "exact", head: true })
      .eq("project_id", data.id);
    return { count: count ?? 0 };
  });

export const publishProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const slug = data.id.split("-")[0];
    const { error } = await supabase
      .from("projects")
      .update({ published: true, slug })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, slug };
  });

export const duplicateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: orig, error: e1 } = await supabase
      .from("projects")
      .select("title, initial_prompt, brief, content")
      .eq("id", data.id)
      .single();
    if (e1 || !orig) throw new Error(e1?.message ?? "Projeto não encontrado");
    const { data: row, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        title: `${orig.title} (cópia)`,
        initial_prompt: orig.initial_prompt,
        brief: orig.brief as never,
        content: orig.content as never,
        published: false,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Falha ao duplicar");
    return row;
  });

