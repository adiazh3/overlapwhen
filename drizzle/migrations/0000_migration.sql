CREATE TABLE public.events (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_minute int NOT NULL,
  end_minute int NOT NULL,
  slot_minutes int NOT NULL DEFAULT 30,
  timezone text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '21 days',
  closed boolean NOT NULL DEFAULT false,
  final_start timestamptz,
  final_end timestamptz,
  admin_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  pin_hash text,
  slots bigint[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, name)
);
GRANT SELECT (id,title,description,start_date,end_date,start_minute,end_minute,slot_minutes,timezone,expires_at,closed,final_start,final_end,created_at) ON public.events TO anon, authenticated;
GRANT SELECT (id,event_id,name,slots,created_at,updated_at) ON public.responses TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read responses" ON public.responses FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE public.responses REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;