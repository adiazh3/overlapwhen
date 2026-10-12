import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_minute: number;
  end_minute: number;
  slot_minutes: number;
  timezone: string;
  expires_at: string;
  closed: boolean;
  final_start: string | null;
  final_end: string | null;
  created_at: string;
  dates: string[] | null;
};
export type ResponseRow = { id: string; name: string; slots: number[]; updated_at: string };

const EVENT_COLS =
  "id,title,description,start_date,end_date,start_minute,end_minute,slot_minutes,timezone,expires_at,closed,final_start,final_end,created_at,dates";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomId(len: number) {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const getEventData = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().min(1).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: ev, error } = await sb.from("events").select(EVENT_COLS).eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!ev) return { event: null as EventRow | null, responses: [] as ResponseRow[] };
    const { data: rs, error: e2 } = await sb
      .from("responses")
      .select("id,name,slots,updated_at")
      .eq("event_id", data.id)
      .order("created_at");
    if (e2) throw new Error(e2.message);
    return {
      event: ev as EventRow,
      responses: (rs ?? []).map((r) => ({ ...r, slots: (r.slots ?? []).map(Number) })) as ResponseRow[],
    };
  });

const createSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31).optional(),
    start_minute: z.number().int().min(0).max(1440),
    end_minute: z.number().int().min(0).max(1440),
    slot_minutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]),
    timezone: z.string().min(1).max(64),
  })
  .refine((v) => v.end_minute > v.start_minute, "End time must be after start time")
  .refine((v) => v.end_date >= v.start_date, "End date must be after start date")
  .refine(
    (v) => (Date.parse(v.end_date) - Date.parse(v.start_date)) / 86400000 <= 92,
    "Pick dates within about 3 months",
  );

export const createEvent = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof createSchema>) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = randomId(8);
    const admin_token = randomId(24);
    const { error } = await supabaseAdmin.from("events").insert({
      ...data,
      description: data.description || null,
      dates: data.dates ?? null,
      id,
      admin_token,
      expires_at: new Date(Date.now() + 21 * 86400000).toISOString(),
    });
    if (error) throw new Error(error.message);
    return { id, admin_token };
  });

async function loadOpenEvent(id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ev } = await supabaseAdmin.from("events").select("*").eq("id", id).maybeSingle();
  if (!ev) throw new Error("Event not found");
  if (Date.parse(ev.expires_at) <= Date.now()) throw new Error("This poll has expired");
  return { supabaseAdmin, ev };
}

export const saveResponse = createServerFn({ method: "POST" })
  .inputValidator((input: { event_id: string; name: string; pin?: string | undefined; slots: number[] }) =>
    z
      .object({
        event_id: z.string().min(1).max(40),
        name: z.string().trim().min(1).max(40),
        pin: z
          .string()
          .regex(/^\d{4}$/)
          .optional()
          .or(z.literal("").transform(() => undefined)),
        slots: z.array(z.number().int()).max(3000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, ev } = await loadOpenEvent(data.event_id);
    if (ev.closed) throw new Error("This poll is closed");
    const pinHash = data.pin ? await sha(`${data.event_id}:${data.pin}`) : null;
    const { data: existing } = await supabaseAdmin
      .from("responses")
      .select("id,pin_hash")
      .eq("event_id", data.event_id)
      .ilike("name", data.name)
      .maybeSingle();
    if (existing) {
      if (existing.pin_hash && existing.pin_hash !== pinHash) {
        throw new Error("That name is protected by a PIN. Enter the correct PIN to edit.");
      }
      const { error } = await supabaseAdmin
        .from("responses")
        .update({
          slots: data.slots,
          updated_at: new Date().toISOString(),
          ...(existing.pin_hash ? {} : pinHash ? { pin_hash: pinHash } : {}),
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabaseAdmin
      .from("responses")
      .insert({ event_id: data.event_id, name: data.name, slots: data.slots, pin_hash: pinHash });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkName = createServerFn({ method: "POST" })
  .inputValidator((input: { event_id: string; name: string; pin?: string | undefined }) =>
    z
      .object({ event_id: z.string().max(40), name: z.string().trim().min(1).max(40), pin: z.string().max(4).optional() })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("responses")
      .select("pin_hash")
      .eq("event_id", data.event_id)
      .ilike("name", data.name)
      .maybeSingle();
    if (!existing || !existing.pin_hash) return { ok: true, exists: !!existing };
    const pinHash = data.pin ? await sha(`${data.event_id}:${data.pin}`) : null;
    return { ok: existing.pin_hash === pinHash, exists: true, needsPin: true };
  });

export const adminUpdate = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { event_id: string; token: string; action: "lock" | "close" | "reopen"; start?: number | undefined; end?: number | undefined }) =>
      z
        .object({
          event_id: z.string().max(40),
          token: z.string().min(10).max(64),
          action: z.enum(["lock", "close", "reopen"]),
          start: z.number().int().optional(),
          end: z.number().int().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, ev } = await loadOpenEvent(data.event_id);
    if (ev.admin_token !== data.token) throw new Error("Only the organizer can do that");
    let patch: { closed: boolean; final_start?: string | null; final_end?: string | null };
    if (data.action === "lock") {
      if (data.start == null || data.end == null || data.end <= data.start) throw new Error("Pick a time");
      patch = {
        closed: true,
        final_start: new Date(data.start * 60000).toISOString(),
        final_end: new Date(data.end * 60000).toISOString(),
      };
    } else if (data.action === "close") patch = { closed: true };
    else patch = { closed: false, final_start: null, final_end: null };
    const { error } = await supabaseAdmin.from("events").update(patch).eq("id", data.event_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
