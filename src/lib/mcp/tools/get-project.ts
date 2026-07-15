import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, notAuthed, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_project",
  title: "Get project",
  description:
    "Fetch a single project by id with its team, client contacts, and latest weekly reports.",
  inputSchema: {
    project_id: z.string().uuid().describe("Project UUID."),
    reports_limit: z.number().int().min(0).max(20).default(3),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, reports_limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const sb = supabaseForUser(ctx);
    const [{ data: project, error: pErr }, team, contacts, reports] = await Promise.all([
      sb.from("projects").select("*").eq("id", project_id).maybeSingle(),
      sb.from("team_members").select("*").eq("project_id", project_id),
      sb.from("client_contacts").select("id,name,email,phone").eq("project_id", project_id),
      sb
        .from("weekly_reports")
        .select("*")
        .eq("project_id", project_id)
        .order("week_end", { ascending: false })
        .limit(reports_limit),
    ]);
    if (pErr) return errorResult(pErr.message);
    if (!project) return errorResult("Project not found or access denied.");
    const payload = {
      project,
      team: team.data ?? [],
      client_contacts: contacts.data ?? [],
      weekly_reports: reports.data ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});