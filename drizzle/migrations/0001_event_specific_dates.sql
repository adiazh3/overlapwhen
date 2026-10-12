ALTER TABLE public.events ADD COLUMN dates date[];
GRANT SELECT (dates) ON public.events TO anon, authenticated;