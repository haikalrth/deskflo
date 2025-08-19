import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface TaskData {
  title: string;
  description: string;
  assignee_id?: string;
  team_id?: string;
  deadline?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const taskData: TaskData = await req.json();

    if (!taskData.title || !taskData.description) {
      return new Response(JSON.stringify({ error: "Judul dan deskripsi wajib diisi." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        judul: taskData.title,
        deskripsi: taskData.description,
        assigned_to: taskData.assignee_id,
        team_id: taskData.team_id,
        tenggat_waktu: taskData.deadline,
        status: "Pending",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
