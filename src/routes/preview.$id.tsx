import { useEffect, useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VslPreview } from "@/components/VslPreview";
import type { VslContent } from "@/lib/ai.functions";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

function PreviewPage() {
  const { id } = useParams({ from: "/preview/$id" });
  const [content, setContent] = useState<VslContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("content, title")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setError("Projeto não encontrado ou sem acesso");
      } else {
        setContent(data.content as unknown as VslContent);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        {error ?? "Sem conteúdo"}
      </div>
    );
  }
  return <VslPreview data={content} />;
}
