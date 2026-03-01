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
};

function normalizeLojaName(name: string): string {
  // Remove replacement characters from broken encoding
  return name.replace(/\ufffd/g, "").replace(/\s+/g, " ").trim();
}

const INVALID_COLORS = [".", "-", "indisponivel", "indisponível", "n/a", ""];

function parseCurrency(val: string): number | null {
  if (!val || !val.trim()) return null;
  const cleaned = val.replace(/R\$\s*/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseBattery(val: string): number {
  if (!val || !val.trim()) return 100;
  const num = parseInt(val.replace("%", "").trim(), 10);
  return isNaN(num) ? 100 : num;
}

function normalizeColor(val: string): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (INVALID_COLORS.includes(trimmed.toLowerCase())) return null;
  // Title case
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function extractBrandModel(produto: string): { marca: string; modelo: string } {
  const cleaned = produto.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, "").trim();
  
  const UPPER_WORDS = new Set([
    "GB", "TB", "RAM", "5G", "4G", "LTE", "NFC", "OTG", "HDMI",
    "PRO", "MAX", "PLUS", "MINI", "SE", "XR", "XS", "ULTRA",
    "JBL", "PS5", "PS4", "TWS", "LED", "USB",
  ]);
  const SPECIAL: Record<string, string> = {
    "IPHONE": "iPhone", "IPHOINE": "iPhone", "IPAD": "iPad", "AIRPODS": "AirPods", "MACBOOK": "MacBook",
  };

  function titleCase(input: string): string {
    return input.replace(/\s+/g, " ").replace(/\s*-\s*/g, " ").trim().split(" ").map(word => {
      const upper = word.toUpperCase();
      if (SPECIAL[upper]) return SPECIAL[upper];
      if (UPPER_WORDS.has(upper)) return upper;
      if (/^\d+$/.test(word)) return word;
      if (/^[A-Za-z]?\d+[A-Za-z]*$/.test(word)) return upper;
      if (/^\d+GB$/i.test(word) || /^\d+TB$/i.test(word) || /^\d+RAM$/i.test(word)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(" ");
  }

  if (cleaned.toUpperCase().startsWith("IPHONE") || cleaned.toUpperCase().startsWith("IPHOINE")) {
    const rest = cleaned.substring(cleaned.toUpperCase().startsWith("IPHOINE") ? 7 : 6).trim();
    return { marca: "Apple", modelo: "iPhone " + titleCase(rest) };
  }
  return { marca: "", modelo: titleCase(cleaned) };
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

    // Get next sequential codigo for pendentes
    const { data: maxCodeData } = await supabase.rpc("", {}).catch(() => ({ data: null }));
    // Query max codigo from both tables
    const { data: prodCodes } = await supabase.from("produtos").select("codigo").not("codigo", "is", null).order("codigo", { ascending: false }).limit(1);
    const { data: pendCodes } = await supabase.from("produtos_pendentes_os").select("codigo").not("codigo", "is", null).order("codigo", { ascending: false }).limit(1);
    
    let maxNum = 0;
    for (const src of [prodCodes, pendCodes]) {
      if (src && src.length > 0 && src[0].codigo) {
        const match = src[0].codigo.match(/^PROD-(\d+)$/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
    }
    let nextCodigo = maxNum + 1;

    const dataLines = lines.slice(1); // skip header
    const errors: { line: number; error: string; raw: string }[] = [];
    const rows: Record<string, unknown>[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const cols = line.split(";");

      // Columns: ID;IMEI;Produto;Cor;Origem;Fornecedor;Loja;Valor Custo;Saúde Bateria;SLA (dias);Status
      const imei = (cols[1] || "").trim();
      if (!imei) {
        errors.push({ line: i + 2, error: "IMEI vazio", raw: line.substring(0, 80) });
        continue;
      }

      const { marca, modelo } = extractBrandModel(cols[2] || "");
      const cor = normalizeColor(cols[3] || "");
      const origemEntrada = (cols[4] || "").trim() || "Fornecedor";
      const fornecedorRaw = (cols[5] || "").trim();
      const fornecedor = fornecedorRaw === "-" || !fornecedorRaw ? null : fornecedorRaw;

      const lojaRaw = (cols[6] || "").trim();
      const lojaName = normalizeLojaName(lojaRaw);
      const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;
      if (lojaName && !lojaId) {
        errors.push({ line: i + 2, error: `Loja desconhecida: "${lojaRaw}"`, raw: line.substring(0, 80) });
        continue;
      }

      const valorCusto = parseCurrency(cols[7] || "");
      const saudeBateria = parseBattery(cols[8] || "");

      rows.push({
        imei,
        marca,
        modelo,
        cor,
        codigo: `PROD-${String(nextCodigo).padStart(4, "0")}`,
        origem_entrada: origemEntrada,
        fornecedor,
        loja: lojaId,
        valor_custo: valorCusto,
        valor_custo_original: valorCusto,
        valor_origem: valorCusto,
        saude_bateria: saudeBateria,
        status_geral: "Pendente Estoque",
        data_entrada: today,
        tipo: "Seminovo",
        condicao: "Seminovo",
      });
      nextCodigo++;
    }

    // Insert in batches of 50
    let inserted = 0;
    const BATCH_SIZE = 50;

    for (let b = 0; b < rows.length; b += BATCH_SIZE) {
      const batch = rows.slice(b, b + BATCH_SIZE);
      const { error, data } = await supabase
        .from("produtos_pendentes_os")
        .insert(batch)
        .select("id");

      if (error) {
        // Fallback: insert one by one
        for (let r = 0; r < batch.length; r++) {
          const { error: singleErr, data: singleData } = await supabase
            .from("produtos_pendentes_os")
            .insert([batch[r]])
            .select("id");
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
