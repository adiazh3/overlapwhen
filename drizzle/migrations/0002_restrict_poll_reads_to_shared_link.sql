DROP POLICY IF EXISTS "public read events" ON public.events;
DROP POLICY IF EXISTS "public read responses" ON public.responses;
REVOKE ALL PRIVILEGES ON TABLE public.events, public.responses FROM anon, authenticated;
REVOKE SELECT (id,title,description,start_date,end_date,start_minute,end_minute,slot_minutes,timezone,expires_at,closed,final_start,final_end,admin_token,created_at,dates) ON public.events FROM anon, authenticated;
REVOKE SELECT (id,event_id,name,pin_hash,slots,created_at,updated_at) ON public.responses FROM anon, authenticated;
GRANT ALL ON TABLE public.events, public.responses TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.read_shared_poll(p_event_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  poll jsonb;
  participants jsonb;
  expiry timestamptz;
BEGIN
  IF p_event_id IS NULL OR p_event_id !~ '^[a-zA-Z0-9_-]{1,40}$' THEN
    RETURN jsonb_build_object('event', NULL, 'responses', '[]'::jsonb);
  END IF;
  SELECT jsonb_build_object(
    'id', e.id, 'title', e.title, 'description', e.description,
    'start_date', e.start_date, 'end_date', e.end_date,
    'start_minute', e.start_minute, 'end_minute', e.end_minute,
    'slot_minutes', e.slot_minutes, 'timezone', e.timezone,
    'expires_at', e.expires_at, 'closed', e.closed,
    'final_start', e.final_start, 'final_end', e.final_end,
    'created_at', e.created_at, 'dates', e.dates
  ), e.expires_at INTO poll, expiry
  FROM public.events AS e WHERE e.id = p_event_id;
  IF poll IS NULL THEN
    RETURN jsonb_build_object('event', NULL, 'responses', '[]'::jsonb);
  END IF;
  participants := '[]'::jsonb;
  IF expiry > now() THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name, 'slots', r.slots, 'updated_at', r.updated_at
    ) ORDER BY r.created_at), '[]'::jsonb) INTO participants
    FROM public.responses AS r WHERE r.event_id = p_event_id;
  END IF;
  RETURN jsonb_build_object('event', poll, 'responses', participants);
END;
$$;
REVOKE ALL ON FUNCTION public.read_shared_poll(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_shared_poll(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.read_shared_poll(text) IS 'Shared-link capability read: requires one exact poll ID, returns only explicitly allowlisted fields, never organizer tokens or PIN hashes; no list or wildcard access.';