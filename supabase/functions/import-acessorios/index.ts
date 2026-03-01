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
      // CSV delimited by semicolon
      const csvText = await req.text();
      const lines = csvText.split("\n").filter((l) => l.trim().length > 0);

      if (lines.length < 2) {
        return new Response(JSON.stringify({ error: "CSV vazio ou sem dados" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const dataLines = lines.slice(1); // skip header

      for (const line of dataLines) {
        const cols = line.split(";");
        // Columns: ID;Descricao;Categoria;Fornecedor;Quantidade;Valor Custo;Valor Recomendado;imei;Loja
        const nome = (cols[1] || "").trim();
        if (!isValidName(nome)) continue;

        const categoria = (cols[2] || "").trim() || null;
        const quantidadeRaw = (cols[4] || "").trim();
        const quantidade = quantidadeRaw ? parseInt(quantidadeRaw, 10) : 0;
        const valorCusto = parseCurrency(cols[5] || "");
        const valorVenda = parseCurrency(cols[6] || "");
        const imei = (cols[7] || "").trim() || null;

        const lojaRaw = (cols[8] || "").trim();
        const lojaName = normalizeLojaName(lojaRaw);
        const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;

        dataRows.push({
          nome,
          categoria,
          quantidade: isNaN(quantidade) ? 0 : quantidade,
          valor_custo: valorCusto,
          valor_venda: valorVenda,
          imei,
          loja_id: lojaId,
          status: "Disponivel",
        });
      }
    } else if (contentType.includes("application/json")) {
      // Accept JSON with "rows" array (pre-parsed data)
      const body = await req.json();
      const rows = body.rows;
      if (!rows || !Array.isArray(rows)) {
        return new Response(JSON.stringify({ error: "Campo 'rows' (array) é obrigatório" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      for (const row of rows) {
        const origem = String(row.origem || "").trim();
        const nome = String(row.nome || "").trim();
        if (!isValidName(nome)) continue;

        const lojaRaw = origem;
        const lojaName = normalizeLojaName(lojaRaw);
        const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;
        const quantidade = parseInt(String(row.quantidade || "0"), 10);

        dataRows.push({
          nome,
          categoria: row.categoria || null,
          quantidade: isNaN(quantidade) ? 0 : quantidade,
          valor_custo: parseCurrency(row.valor_custo),
          valor_venda: parseCurrency(row.valor_venda),
          imei: row.imei || null,
          loja_id: lojaId,
          status: "Disponivel",
        });
      }
    } else {
      // Accept raw XLSX binary
      const arrayBuffer = await req.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      for (const row of jsonData as Record<string, unknown>[]) {
        const origem = String(row["Origem"] || "").trim();
        const nome = String(row["Modelo + Descrição"] || row["Modelo + Descricao"] || "").trim();
        if (!isValidName(nome)) continue;

        const categoria = String(row["Categoria"] || "").trim();
        const quantidadeRaw = row["Quantidade em estoque"];
        const valorCustoRaw = row["Valor Custo"];
        const valorRecomendadoRaw = row["Valor Recomendado"];
        const imeiRaw = String(row["IMEI"] || "").trim();

        const lojaRaw = origem;
        const lojaName = normalizeLojaName(lojaRaw);
        const lojaId = LOJA_MAP[lojaName] || LOJA_MAP[lojaRaw] || null;
        const quantidade = quantidadeRaw ? parseInt(String(quantidadeRaw), 10) : 0;

        dataRows.push({
          nome,
          categoria: categoria || null,
          quantidade: isNaN(quantidade) ? 0 : quantidade,
          valor_custo: parseCurrency(valorCustoRaw),
          valor_venda: parseCurrency(valorRecomendadoRaw),
          imei: imeiRaw || null,
          loja_id: lojaId,
          status: "Disponivel",
        });
      }
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
          const { error: singleErr, data: singleData } = await supabase
            .from("acessorios")
            .insert([batch[r]])
            .select("id");
          if (singleErr) {
            errors.push({ line: b + r + 2, error: singleErr.message });
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
          total_parseado: dataRows.length,
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
