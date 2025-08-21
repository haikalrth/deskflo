// Impor library yang diperlukan dari Supabase dan Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Fungsi delete-task diinisialisasi");

Deno.serve(async (req) => {
  // Menangani preflight request untuk CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Membuat koneksi ke Supabase dengan hak akses pengguna yang melakukan request
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: req.headers.get("Authorization")! } } });

    // Mengambil taskId dari body request
    const { taskId } = await req.json();

    if (!taskId) {
      throw new Error("ID Tugas diperlukan.");
    }

    // Melakukan operasi hapus pada tabel 'tasks'
    const { error } = await supabase.from("tasks").delete().eq("id", taskId); // Menghapus baris dimana 'id' cocok dengan taskId

    if (error) {
      throw error; // Jika ada error dari Supabase, lemparkan
    }

    // Mengirim respons sukses jika berhasil
    return new Response(JSON.stringify({ message: `Tugas berhasil dihapus.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    // Mengirim respons error jika terjadi masalah
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
