import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOJA_MAP: Record<string, string> = {
  "Estoque - SIA": "fe27bdab-b6de-433c-8718-3f1690f2315d",
  "Estoque - Shopping Sul": "949afa0c-6324-4a4e-ab6e-f7071fcfc3c0",
  "Estoque - Shopping JK": "f071311a-5532-4874-bb9c-5a2e550300c8",
  "Estoque - Águas Lindas": "9c33d643-52dd-4134-8c91-2e01ddc05937",
  "Estoque - Aguas Lindas": "9c33d643-52dd-4134-8c91-2e01ddc05937",
  "Estoque - Online": "df3995f6-1da1-4661-a68f-20fb548a9468",
  "Águas Lindas Shopping": "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6",
  "Aguas Lindas Shopping": "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6",
};

function normalizeLojaName(name: string): string {
  return name.replace(/\ufffd/g, "").replace(/\s+/g, " ").trim();
}

function parseCurrency(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return val;
  const str = String(val);
  const cleaned = str.replace(/R\$\s*/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function isValidName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed || trimmed === "0") return false;
  return true;
}

// Title Case com regras especiais para siglas e marcas
function titleCaseNome(input: string): string {
  if (!input) return input;
  let cleaned = input.replace(/\s+/g, " ").replace(/\s*-\s*/g, " ").trim();
  
  const UPPER_WORDS = new Set([
    "GB", "TB", "RAM", "5G", "4G", "LTE", "NFC", "OTG", "HDMI", "USB-C", "USBC", "TYPEC",
    "PRO", "MAX", "PLUS", "MINI", "SE", "XR", "XS", "ULTRA",
    "JBL", "PS5", "PS4", "PS3", "TWS", "LED", "LCD", "HD", "FHD", "QHD",
    "USB", "AUX", "MFI", "PD", "QC",
  ]);
  
  const SPECIAL: Record<string, string> = {
    "IPHONE": "iPhone", "IPHOINE": "iPhone",
    "IPAD": "iPad", "AIRPODS": "AirPods", "MACBOOK": "MacBook",
  };

  return cleaned.split(" ").map(word => {
    const upper = word.toUpperCase();
    if (SPECIAL[upper]) return SPECIAL[upper];
    if (UPPER_WORDS.has(upper)) return upper;
    if (/^\d+$/.test(word)) return word;
    if (/^[A-Za-z]?\d+[A-Za-z]*$/.test(word)) return upper;
    if (/^\d+GB$/i.test(word) || /^\d+TB$/i.test(word) || /^\d+RAM$/i.test(word)) return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

async function getNextAcessorioCodigo(supabase: any): Promise<number> {
  const { data } = await supabase
    .from("acessorios")
    .select("codigo")
    .not("codigo", "is", null)
    .order("codigo", { ascending: false })
    .limit(1);
  
  if (data && data.length > 0 && data[0].codigo) {
    const match = data[0].codigo.match(/^AC-(\d+)$/);
    if (match) return parseInt(match[1], 10) + 1;
  }
  return 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const contentType = req.headers.get("content-type") || "";
    let dataRows: Record<string, unknown>[] = [];

    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      const csvText = await req.text();
      const lines = csvText.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return new Response(JSON.stringify({ error: "CSV vazio ou sem dados" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
      const dataLines = lines.slice(1);
      for (const line of dataLines) {
        const cols = line.split(";");
        const nome = titleCaseNome((cols[1] || "").trim());
        if (!isValidName(nome)) continue;
        const lojaRaw = (cols[8] || "").trim();
        const lojaName = normalizeLojaName(lojaRaw);
        const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;
        const quantidade = parseInt((cols[4] || "").trim(), 10);
        dataRows.push({
          nome, categoria: (cols[2] || "").trim() || null,
          quantidade: isNaN(quantidade) ? 0 : quantidade,
          valor_custo: parseCurrency(cols[5] || ""), valor_venda: parseCurrency(cols[6] || ""),
          imei: (cols[7] || "").trim() || null, loja_id: lojaId, status: "Disponivel",
        });
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      const rows = body.rows;
      if (!rows || !Array.isArray(rows)) {
        return new Response(JSON.stringify({ error: "Campo 'rows' (array) é obrigatório" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
      for (const row of rows) {
        const nome = titleCaseNome(String(row.nome || "").trim());
        if (!isValidName(nome)) continue;
        const lojaRaw = String(row.origem || "").trim();
        const lojaName = normalizeLojaName(lojaRaw);
        const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;
        const quantidade = parseInt(String(row.quantidade || "0"), 10);
        dataRows.push({
          nome, categoria: row.categoria || null,
          quantidade: isNaN(quantidade) ? 0 : quantidade,
          valor_custo: parseCurrency(row.valor_custo), valor_venda: parseCurrency(row.valor_venda),
          imei: row.imei || null, loja_id: lojaId, status: "Disponivel",
        });
      }
    } else {
      const arrayBuffer = await req.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      for (const row of jsonData as Record<string, unknown>[]) {
        const nome = titleCaseNome(String(row["Modelo + Descrição"] || row["Modelo + Descricao"] || "").trim());
        if (!isValidName(nome)) continue;
        const lojaRaw = String(row["Origem"] || "").trim();
        const lojaName = normalizeLojaName(lojaRaw);
        const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;
        const quantidade = parseInt(String(row["Quantidade em estoque"] || "0"), 10);
        dataRows.push({
          nome, categoria: String(row["Categoria"] || "").trim() || null,
          quantidade: isNaN(quantidade) ? 0 : quantidade,
          valor_custo: parseCurrency(row["Valor Custo"]), valor_venda: parseCurrency(row["Valor Recomendado"]),
          imei: String(row["IMEI"] || "").trim() || null, loja_id: lojaId, status: "Disponivel",
        });
      }
    }

    // Get next sequential codigo
    let nextCodigo = await getNextAcessorioCodigo(supabase);
    
    // Assign codigos
    for (const row of dataRows) {
      row.codigo = `AC-${String(nextCodigo).padStart(4, "0")}`;
      nextCodigo++;
    }

    // Insert in batches
    let inserted = 0;
    const errors: { line: number; error: string }[] = [];
    const BATCH_SIZE = 50;

    for (let b = 0; b < dataRows.length; b += BATCH_SIZE) {
      const batch = dataRows.slice(b, b + BATCH_SIZE);
      const { error, data } = await supabase.from("acessorios").insert(batch).select("id");
      if (error) {
        for (let r = 0; r < batch.length; r++) {
          const { error: singleErr, data: singleData } = await supabase.from("acessorios").insert([batch[r]]).select("id");
          if (singleErr) { errors.push({ line: b + r + 2, error: singleErr.message }); }
          else { inserted += singleData?.length || 0; }
        }
      } else { inserted += data?.length || 0; }
    }

    return new Response(
      JSON.stringify({ summary: { total_parseado: dataRows.length, total_inserido: inserted, total_erros: errors.length }, errors: errors.slice(0, 50) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
