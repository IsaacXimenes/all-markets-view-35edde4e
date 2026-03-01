import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOJA_MAP: Record<string, string> = {
  "Shopping Sul": "0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad",
  "JK Shopping": "9009b91c-0436-4070-9d30-670b8e6bd68e",
  "Aguas Lindas": "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6",
  "Águas Lindas": "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6",
  "Aguas Lindas Shopping": "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6",
  "Águas Lindas Shopping": "b2c6ac94-f08b-4c2e-955f-8a91d658d7d6",
  "Estoque - SIA": "fe27bdab-b6de-433c-8718-3f1690f2315d",
  "Online": "df3995f6-1da1-4661-a68f-20fb548a9468",
  "Matriz": "6231ea0e-9ff3-4ad6-b822-6f9a8270afa6",
};

function normalizeLojaName(name: string): string {
  return name.replace(/\ufffd/g, "").replace(/\s+/g, " ").trim();
}

function parseCurrency(val: string): number | null {
  if (!val || !val.trim()) return null;
  const cleaned = val.replace(/R\$\s*/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseBattery(val: string): number | null {
  if (!val || !val.trim()) return null;
  const num = parseInt(val.replace("%", "").trim(), 10);
  return isNaN(num) ? null : num;
}

function cleanModel(val: string): string {
  return val.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, "").trim();
}

// Title Case com regras especiais
function titleCaseModelo(input: string): string {
  if (!input) return input;
  let cleaned = input.replace(/\s+/g, " ").replace(/\s*-\s*/g, " ").trim();
  cleaned = cleaned.replace(/IPHOINE/gi, "IPHONE");
  
  const UPPER_WORDS = new Set([
    "GB", "TB", "RAM", "5G", "4G", "LTE", "NFC", "OTG", "HDMI", "USB-C", "USBC", "TYPEC",
    "PRO", "MAX", "PLUS", "MINI", "SE", "XR", "XS", "ULTRA",
    "JBL", "PS5", "PS4", "PS3", "TWS", "LED", "LCD", "HD", "FHD", "QHD", "USB", "AUX",
  ]);
  const SPECIAL: Record<string, string> = {
    "IPHONE": "iPhone", "IPAD": "iPad", "AIRPODS": "AirPods", "MACBOOK": "MacBook",
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

function normalizeTipo(val: string): string {
  if (!val || !val.trim()) return "Seminovo";
  const lower = val.trim().toLowerCase();
  if (lower === "novo") return "Novo";
  return "Seminovo";
}

function parseBool(val: string): boolean {
  return val?.trim()?.toLowerCase() === "true";
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

    const csvText = await req.text();
    const lines = csvText.split("\n").filter((l) => l.trim().length > 0);
    
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV vazio ou sem dados" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Skip header (line 0)
    const dataLines = lines.slice(1);
    const errors: { line: number; error: string; raw: string }[] = [];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const cols = line.split(";");
      
      // CSV columns: id;imei;marca;modelo;cor;tipo;quantidade;valorCusto;valorVendaSugerido;vendaRecomendada;saudeBateria;loja;estoqueConferido;assistenciaConferida;condicao;historicoCusto;historicoValorRecomendado;statusNota;origemEntrada
      
      const marca = titleCaseModelo(cleanModel(cols[2] || "").trim());
      const modelo = titleCaseModelo(cleanModel(cols[3] || "").trim());
      
      if (!marca || !modelo) {
        errors.push({ line: i + 2, error: "marca ou modelo vazio", raw: line.substring(0, 100) });
        continue;
      }

      const lojaRaw = (cols[11] || "").trim();
      const lojaName = normalizeLojaName(lojaRaw);
      const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;
      
      if (lojaName && !lojaId) {
        errors.push({ line: i + 2, error: `Loja desconhecida: "${lojaRaw}"`, raw: line.substring(0, 100) });
        continue;
      }

      rows.push({
        imei: (cols[1] || "").trim() || null,
        marca,
        modelo,
        cor: (cols[4] || "").trim() || null,
        tipo: normalizeTipo(cols[5] || ""),
        quantidade: parseInt(cols[6]?.trim() || "1", 10) || 1,
        valor_custo: parseCurrency(cols[7] || ""),
        valor_venda_sugerido: parseCurrency(cols[8] || ""),
        venda_recomendada: parseCurrency(cols[9] || ""),
        saude_bateria: parseBattery(cols[10] || ""),
        loja_id: lojaId,
        loja_atual_id: lojaId,
        estoque_conferido: parseBool(cols[12] || ""),
        assistencia_conferida: parseBool(cols[13] || ""),
        condicao: (cols[14] || "").trim() || null,
        status_nota: (cols[17] || "").trim() || "Concluido",
        origem_entrada: (cols[18] || "").trim() || "Fornecedor",
        status: "Disponivel",
      });
    }

    // Insert in batches of 50, skip duplicates
    let inserted = 0;
    const BATCH_SIZE = 50;

    for (let b = 0; b < rows.length; b += BATCH_SIZE) {
      const batch = rows.slice(b, b + BATCH_SIZE);
      const { error, data } = await supabase.from("produtos").upsert(batch, { onConflict: "imei", ignoreDuplicates: true }).select("id");
      
      if (error) {
        // Fallback: insert one by one
        for (let r = 0; r < batch.length; r++) {
          const { error: singleErr, data: singleData } = await supabase.from("produtos").upsert([batch[r]], { onConflict: "imei", ignoreDuplicates: true }).select("id");
          if (singleErr) {
            errors.push({ line: b + r + 2, error: singleErr.message, raw: "" });
          } else {
            inserted += singleData?.length || 0;
          }
        }
      } else {
        inserted += data?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        summary: {
          total_linhas_csv: dataLines.length,
          total_parseado: rows.length,
          total_inserido: inserted,
          total_erros: errors.length,
        },
        errors: errors.slice(0, 50),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

