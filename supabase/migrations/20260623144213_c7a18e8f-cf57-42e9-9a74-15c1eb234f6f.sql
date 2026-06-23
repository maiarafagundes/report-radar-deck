
CREATE TABLE public.executive_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX executive_summaries_generated_at_idx ON public.executive_summaries (generated_at DESC);

GRANT SELECT, INSERT ON public.executive_summaries TO authenticated;
GRANT ALL ON public.executive_summaries TO service_role;

ALTER TABLE public.executive_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read executive summaries"
  ON public.executive_summaries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert executive summaries"
  ON public.executive_summaries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = generated_by OR generated_by IS NULL);

CREATE POLICY "Admins can manage executive summaries"
  ON public.executive_summaries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.executive_summaries;
