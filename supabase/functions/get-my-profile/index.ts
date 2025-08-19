import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization")! } } });

    // Ambil data user yang sedang login dari token JWT-nya
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found.");

    // Ambil data dari tabel 'profiles' berdasarkan ID user
    const { data: profile, error } = await supabase.from("profiles").select("nama_lengkap, npm, jurusan, email").eq("id", user.id).single();

    if (error) throw error;

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
