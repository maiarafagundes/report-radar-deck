import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, notAuthed, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_executive_summary",
  title: "Get latest executive summary",
  description:
    "Return the most recent AI-generated executive summary of the project portfolio. Admins and stakeholders only.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const { data, error } = await supabaseForUser(ctx)
      .from("executive_summaries")
      .select("id,generated_at,payload")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return { content: [{ type: "text", text: "No executive summary available yet." }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { summary: data },
    };
  },
});