-- Project versions table for undo history
CREATE TABLE public.project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content JSONB NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_versions_project ON public.project_versions(project_id, created_at DESC);

ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Versions viewable by owner"
ON public.project_versions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Versions insert by owner"
ON public.project_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Versions delete by owner"
ON public.project_versions FOR DELETE
USING (auth.uid() = user_id);

-- Storage bucket for VSL videos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vsl-videos', 'vsl-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "VSL videos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'vsl-videos');

CREATE POLICY "VSL videos owner upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vsl-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "VSL videos owner delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'vsl-videos' AND auth.uid()::text = (storage.foldername(name))[1]);