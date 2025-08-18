import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Definisi tipe untuk data yang masuk dari request body
interface ProgrammerData {
  programmerId: string;
  nama_lengkap: string;
  npm: string;
  jurusan: string;
  email: string;
  role: string;
}

Deno.serve(async (req) => {
  // Tangani preflight request untuk CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inisialisasi Supabase client
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Ambil data dari body request
    const { programmerId, nama_lengkap, npm, jurusan, email, role }: ProgrammerData = await req.json();

    // Validasi data yang masuk
    if (!programmerId || !nama_lengkap || !npm || !email) {
      return new Response(JSON.stringify({ error: "Data tidak lengkap: programmerId, nama, npm, dan email wajib diisi." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // [FIX] Ubah nilai role menjadi huruf kecil
    const standardizedRole = role.toLowerCase();

    // Lakukan operasi update pada tabel 'profiles'
    const { data, error } = await supabase
      .from("profiles")
      .update({
        nama_lengkap,
        npm,
        jurusan,
        email,
        role: standardizedRole, // Gunakan nilai yang sudah distandarisasi
      })
      .eq("id", programmerId)
      .select()
      .single();

    // Tangani jika terjadi error saat update
    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "23505") {
        return new Response(JSON.stringify({ error: "Email atau NPM sudah terdaftar." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        });
      }
      throw error;
    }

    // Kirim respons sukses
    return new Response(JSON.stringify({ message: "Data programmer berhasil diperbarui", data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("General error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
