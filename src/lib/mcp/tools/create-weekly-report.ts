import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, notAuthed, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_weekly_report",
  title: "Create weekly report",
  description:
    "Create a weekly status report for a project. Requires admin or tech lead role (enforced by RLS).",
  inputSchema: {
    project_id: z.string().uuid(),
    week_start: z.string().describe("ISO date YYYY-MM-DD"),
    week_end: z.string().describe("ISO date YYYY-MM-DD"),
    status: z
      .enum(["on-track", "at-risk", "delayed", "completed"])
      .default("on-track"),
    summary: z.string().default(""),
    highlights: z.array(z.string()).default([]),
    blockers: z.array(z.string()).default([]),
    in_progress: z.array(z.string()).default([]),
    next_steps: z.array(z.string()).default([]),
    indicators: z.array(z.string()).default([]),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const { data, error } = await supabaseForUser(ctx)
      .from("weekly_reports")
      .insert(input)
      .select()
      .single();
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: `Report created: ${data.id}` }],
      structuredContent: { weekly_report: data },
    };
  },
});