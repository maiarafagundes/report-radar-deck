import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projects } = await req.json();
    if (!Array.isArray(projects)) {
      return new Response(JSON.stringify({ error: "projects array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compact payload for the model
    const compact = projects.map((p: any) => {
      const last = (p.weeklyReports || [])[0];
      return {
        nome: p.name,
        tipo: p.type,
        categoria: p.category,
        status: p.status,
        progresso: p.progress,
        inicio: p.startDate,
        fim: p.endDate,
        time: (p.team || []).map((m: any) => `${m.name} (${m.role})`).join(", "),
        ultimoReport: last ? {
          semana: `${last.weekStart} a ${last.weekEnd}`,
          resumo: last.summary,
          destaques: last.highlights,
          bloqueios: last.blockers,
          emAndamento: last.inProgress,
          proximosPassos: last.nextSteps,
          indicadores: last.indicators,
        } : null,
      };
    });

    const systemPrompt = `Você é um analista executivo sênior de DevOps/SRE. Analise o portfólio de projetos e gere um status executivo consolidado em português, objetivo, com tom corporativo. Identifique padrões, riscos sistêmicos, oportunidades e proponha ações práticas. Para cada destaque e risco, identifique explicitamente quais projetos estão relacionados. Responda APENAS com JSON válido seguindo o schema solicitado.`;

    const userPrompt = `Portfólio (${compact.length} projetos):\n\n${JSON.stringify(compact, null, 2)}\n\nGere um status executivo consolidado.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "gerar_status_executivo",
            description: "Retorna o status executivo consolidado do portfólio",
            parameters: {
              type: "object",
              properties: {
                resumo: { type: "string", description: "Resumo executivo do portfólio em 3-5 frases" },
                destaques: {
                  type: "array",
                  description: "5 a 8 destaques/conquistas relevantes com identificacao dos projetos relacionados",
                  items: {
                    type: "object",
                    properties: {
                      texto: { type: "string", description: "Descricao do destaque" },
                      projetos: { type: "array", items: { type: "string" }, description: "Nomes dos projetos relacionados a este destaque" },
                    },
                    required: ["texto", "projetos"],
                    additionalProperties: false,
                  },
                },
                riscos: {
                  type: "array",
                  description: "5 a 8 riscos e bloqueios sistêmicos com identificacao dos projetos relacionados",
                  items: {
                    type: "object",
                    properties: {
                      texto: { type: "string", description: "Descricao do risco" },
                      projetos: { type: "array", items: { type: "string" }, description: "Nomes dos projetos relacionados a este risco" },
                    },
                    required: ["texto", "projetos"],
                    additionalProperties: false,
                  },
                },
                todos: {
                  type: "array",
                  description: "5 a 10 ações recomendadas (TO-DOs) priorizadas",
                  items: {
                    type: "object",
                    properties: {
                      acao: { type: "string" },
                      prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                      responsavel: { type: "string", description: "Projeto, time ou papel responsável" },
                    },
                    required: ["acao", "prioridade", "responsavel"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["resumo", "destaques", "riscos", "todos"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "gerar_status_executivo" } },
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      return new Response(JSON.stringify({ error: "AI gateway error", status: response.status, detail: txt }), {
        status: response.status === 429 || response.status === 402 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No tool call returned", raw: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});