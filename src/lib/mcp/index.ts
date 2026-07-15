import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjects from "./tools/list-projects";
import getProject from "./tools/get-project";
import listWeeklyReports from "./tools/list-weekly-reports";
import createWeeklyReport from "./tools/create-weekly-report";
import listProfessionals from "./tools/list-professionals";
import getExecutiveSummary from "./tools/get-executive-summary";
import me from "./tools/me";

// Direct Supabase issuer (not the lovable.cloud proxy) is what discovery
// publishes. Built from the project ref so it stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "v8-portfolio-mcp",
  title: "V8 Portfolio MCP",
  version: "0.1.0",
  instructions:
    "DevOps/SRE portfolio management for V8. Use `me` to check the caller's roles, `list_projects` and `get_project` to explore the portfolio, `list_weekly_reports` for a project's status history, `create_weekly_report` to add a new weekly status (admin or tech lead only), `list_professionals` for the internal team, and `get_executive_summary` for the latest AI-generated portfolio overview.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    me,
    listProjects,
    getProject,
    listWeeklyReports,
    createWeeklyReport,
    listProfessionals,
    getExecutiveSummary,
  ],
});