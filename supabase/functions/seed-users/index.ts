import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AUTHORIZED_USERNAMES = [
  "anna.vieira", "anderson.batista", "antonio.filho", "athirson.marques",
  "athirson.nascimento", "bruno.peres", "caio.santos", "cauã.pereira",
  "cauã.santos", "eilanne.alves", "elida.souza", "evelyn.cordeiro",
  "fellipe.rodrigues", "fernanda.lima", "francilene.almeida", "gabriel.monteiro",
  "gabriel.lima", "geane.sousa", "geisiane.silva", "geovanna.santos",
  "gustavo.andrade", "gustavo.santos", "hayanne.santini", "isaac.ximenes",
  "izaquiel.santos", "jaciane.monteiro", "jeferson.cabral", "jessica.araújo",
  "joao.pereira", "joao.santos", "joao.souza", "julio.santos",
  "julio.silva", "kellen.valverde", "kelvin.fernandes", "laina.lima",
  "leandro.santos", "leandro.amorim", "leonardo.alves", "leonardo.carvalho",
  "leticia.araujo", "lorranny.rodrigues", "luana.castro", "marco.leal",
  "marco.alves", "marcos.sousa", "maria.lima", "maria.araujo",
  "matheus.silva", "matheus.eduardo", "matheus.holanda", "matheus.mota",
  "matheus.coimbra", "meline.almeida", "natanael.silva", "patrycia.souza",
  "paula.brito", "pedro.peres", "pedro.ferreira", "priscila.costa",
  "rafael.sousa", "rian.silva", "roberto.andrade", "ryan.souza",
  "sabrina.silva", "samuel.nonato", "sarah.coimbra", "stephanie.sousa",
  "suelen.souza", "tamires.oliveira", "wender.biet", "wender.lima",
  "yslana.almeida", "iwry.macedo", "vinício.silva",
];

// Transliterate accented chars for email compatibility
function transliterateForEmail(username: string): string {
  return username
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function capitalizeUsername(username: string): string {
  return username
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

    const tempPassword = "TI@2025!temp";
    const results: { username: string; status: string; error?: string }[] = [];

    // Fetch all colaboradores for matching
    const { data: colaboradores } = await supabase
      .from("colaboradores")
      .select("id, nome, cargo, eh_gestor, eh_vendedor, eh_estoquista");

    // Fetch all existing auth users once
    const { data: existingUsersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingUsersMap = new Map<string, string>();
    if (existingUsersData?.users) {
      for (const u of existingUsersData.users) {
        if (u.email) existingUsersMap.set(u.email, u.id);
      }
    }

    for (const username of AUTHORIZED_USERNAMES) {
      const emailUsername = transliterateForEmail(username);
      const email = `${emailUsername}@thiagoimports.com.br`;
      const nomeCompleto = capitalizeUsername(username);

      try {
        // Create user in auth
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
        });

        if (createError) {
          // User already exists - update their profile anyway
          if (createError.message?.includes("already been registered")) {
            const existingUserId = existingUsersMap.get(email);
            
            if (existingUserId && colaboradores) {
              const nameParts = username.split(".");
              const firstName = nameParts[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
              const lastName = nameParts[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
              const match = colaboradores.find((c: any) => {
                const cNome = c.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                return cNome.includes(firstName) && cNome.includes(lastName);
              });
              
              if (match) {
                await supabase.from("profiles").update({
                  nome_completo: nomeCompleto,
                  colaborador_id: match.id,
                  cargo: match.cargo,
                  eh_gestor: match.eh_gestor || false,
                  eh_vendedor: match.eh_vendedor || false,
                  eh_estoquista: match.eh_estoquista || false,
                }).eq("id", existingUserId);
              }
            }
            results.push({ username, status: "updated" });
            continue;
          }
          results.push({ username, status: "error", error: createError.message });
          continue;
        }

        if (!userData.user) {
          results.push({ username, status: "error", error: "No user returned" });
          continue;
        }

        // Find matching colaborador by name similarity
        let colaboradorId: string | null = null;
        let cargo: string | null = null;
        let ehGestor = false;
        let ehVendedor = false;
        let ehEstoquista = false;

        if (colaboradores) {
          const nameParts = username.split(".");
          const firstName = nameParts[0].toLowerCase();
          const lastName = nameParts[1].toLowerCase();

          const match = colaboradores.find((c) => {
            const cNome = c.nome.toLowerCase();
            return cNome.includes(firstName) && cNome.includes(lastName);
          });

          if (match) {
            colaboradorId = match.id;
            cargo = match.cargo;
            ehGestor = match.eh_gestor || false;
            ehVendedor = match.eh_vendedor || false;
            ehEstoquista = match.eh_estoquista || false;
          }
        }

        // Update profile (created by trigger)
        await supabase
          .from("profiles")
          .update({
            nome_completo: nomeCompleto,
            colaborador_id: colaboradorId,
            cargo,
            eh_gestor: ehGestor,
            eh_vendedor: ehVendedor,
            eh_estoquista: ehEstoquista,
            first_login: true,
          })
          .eq("id", userData.user.id);

        results.push({ username, status: "created" });
      } catch (e) {
        results.push({ username, status: "error", error: String(e) });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const existing = results.filter((r) => r.status === "already_exists").length;
    const errors = results.filter((r) => r.status === "error");

    return new Response(
      JSON.stringify({
        summary: { total: AUTHORIZED_USERNAMES.length, created, existing, errors: errors.length },
        details: results,
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
