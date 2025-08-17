import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      throw new Error("Request ID is required.");
    }

    // Buat Supabase client dengan hak akses admin penuh
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // 1. Ambil data dari permintaan akun
    const { data: requestData, error: requestError } = await supabaseAdmin.from("account_requests").select("*").eq("id", requestId).single();

    if (requestError) throw requestError;

    // 2. Kirim email undangan ke pengguna baru untuk membuat akun
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(requestData.email);

    if (inviteError) throw inviteError;
    const newUserId = inviteData.user.id;

    // 3. Buat profil publik untuk pengguna baru
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      nama_lengkap: requestData.nama_lengkap,
      npm: requestData.npm,
      jurusan: requestData.jurusan,
      email: requestData.email,
      role: "programmer", // Default role
    });

    if (profileError) throw profileError;

    // 4. Update status permintaan akun menjadi 'approved'
    const { error: updateError } = await supabaseAdmin.from("account_requests").update({ status: "approved" }).eq("id", requestId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ message: "User approved and invited successfully!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
