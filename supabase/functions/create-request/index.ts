import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestData {
  nama_lengkap: string;
  npm: string;
  jurusan: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const requestData: RequestData = await req.json();

    // Validasi input dasar
    if (!requestData.nama_lengkap || !requestData.npm || !requestData.email) {
      throw new Error("Nama, NPM, dan Email wajib diisi.");
    }

    // Masukkan data ke dalam tabel 'requests'
    const { error } = await supabase.from("requests").insert({
      nama_lengkap: requestData.nama_lengkap,
      npm: requestData.npm,
      jurusan: requestData.jurusan,
      email: requestData.email,
      status: "pending", // Status awal selalu 'pending'
    });

    if (error) {
      // Cek jika error karena email duplikat
      if (error.code === "23505") {
        // Kode error PostgreSQL untuk unique violation
        throw new Error("Email ini sudah pernah digunakan untuk mengajukan permohonan.");
      }
      throw error;
    }

    return new Response(JSON.stringify({ message: "Pengajuan berhasil dikirim!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
