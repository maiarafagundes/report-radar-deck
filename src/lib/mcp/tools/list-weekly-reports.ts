import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, notAuthed, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_weekly_reports",
  title: "List weekly reports",
  description: "List weekly status reports for a project, newest first.",
  inputSchema: {
    project_id: z.string().uuid(),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const { data, error } = await supabaseForUser(ctx)
      .from("weekly_reports")
      .select("*")
      .eq("project_id", project_id)
      .order("week_end", { ascending: false })
      .limit(limit);
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { weekly_reports: data ?? [] },
    };
  },
});