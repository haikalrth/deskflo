// supabase/functions/get-tasks/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Konfigurasi Supabase (pakai SERVICE_ROLE kalau ada, fallback ke ANON) ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// --- Header CORS ---
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Ambil semua kolom, urut terbaru. TANPA prefix "tasks."
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
    id,
    judul,
    deskripsi,
    status,
    tenggat_waktu,
    created_at,
    profiles:assigned_to (nama_lengkap)
  `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Normalisasi field agar cocok dengan jobs-admin.html
    const normalized = (data ?? []).map((t: any) => ({
      id: t.id ?? t.task_id ?? t.uuid,
      title: t.title ?? t.judul ?? t.name ?? t.task_title ?? "(tanpa judul)",
      description: t.description ?? t.deskripsi ?? t.detail ?? null,
      status: t.status ?? t.state ?? "In Progress",
      assignee_name: t.profiles?.nama_lengkap ?? "-", // ✅ ambil nama lengkap
      project_name: t.project_name ?? t.project ?? null,
      team_name: t.team_name ?? t.team ?? null,
      pr_link: t.pr_link ?? null,
      original_description: t.original_description ?? null,
      subtasks: t.subtasks ?? null,
      created_at: t.created_at ?? null,
    }));

    return new Response(JSON.stringify(normalized), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500, headers: corsHeaders });
  }
});
