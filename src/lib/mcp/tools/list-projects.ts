import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, notAuthed, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_projects",
  title: "List projects",
  description:
    "List DevOps/SRE portfolio projects the signed-in user can see. Tech leads only see projects they are allocated to; admins and stakeholders see all.",
  inputSchema: {
    status: z
      .enum(["on-track", "at-risk", "delayed", "completed"])
      .describe("Optional status filter.")
      .optional(),
    limit: z.number().int().min(1).max(200).default(50).describe("Max rows returned."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx)
      .from("projects")
      .select("id,name,type,category,status,progress,start_date,end_date,tags")
      .order("start_date", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});