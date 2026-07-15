import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, notAuthed, supabaseForUser } from "../supabase";

export default defineTool({
  name: "me",
  title: "Who am I",
  description: "Return the signed-in user's profile and roles in this app.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const sb = supabaseForUser(ctx);
    const uid = ctx.getUserId();
    const [{ data: profile, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("user_roles").select("role").eq("user_id", uid),
    ]);
    if (pErr) return errorResult(pErr.message);
    if (rErr) return errorResult(rErr.message);
    const payload = {
      user_id: uid,
      email: ctx.getUserEmail(),
      profile,
      roles: (roles ?? []).map((r: any) => r.role),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});