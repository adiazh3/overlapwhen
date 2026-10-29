ALTER TABLE public.responses ADD COLUMN availability_minutes integer CHECK (availability_minutes IN (15, 30));
COMMENT ON COLUMN public.responses.availability_minutes IS 'NULL denotes legacy event-length availability; new writes use independent availability increments.';
CREATE OR REPLACE FUNCTION public.read_shared_poll(p_event_id text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $function$
DECLARE poll jsonb; participants jsonb; expiry timestamptz;
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
    'created_at', e.created_at, 'dates', e.dates, 'lock_history', e.lock_history
  ), e.expires_at INTO poll, expiry
  FROM public.events AS e WHERE e.id = p_event_id;
  IF poll IS NULL THEN RETURN jsonb_build_object('event', NULL, 'responses', '[]'::jsonb); END IF;
  participants := '[]'::jsonb;
  IF expiry > now() THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'slots', r.slots, 'availability_minutes', r.availability_minutes, 'updated_at', r.updated_at) ORDER BY r.created_at), '[]'::jsonb) INTO participants
    FROM public.responses AS r WHERE r.event_id = p_event_id;
  END IF;
  RETURN jsonb_build_object('event', poll, 'responses', participants);
END; $function$;
REVOKE ALL ON FUNCTION public.read_shared_poll(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_shared_poll(text) TO anon, authenticated, service_role;