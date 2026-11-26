import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";
import Login from "@/components/dashboard/Login";
import { isAuthed, passwordConfigured } from "@/lib/auth";
import { appsScriptConfigured } from "@/lib/appsScript";
import { getContent } from "@/lib/content";
import "./dashboard.css";
import "./invites.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  if (!(await isAuthed())) return <Login configured={passwordConfigured()} />;
  const content = await getContent({ fresh: true });
  const { invitesSource, ...initial } = content;
  // GOOGLE_SHEET_URL: the spreadsheet's address, for the "Google Sheet" shortcut (only Google Sheets links are accepted)
  const sheet = process.env.GOOGLE_SHEET_URL?.trim() ?? "";
  const sheetUrl = /^https:\/\/docs\.google\.com\/spreadsheets\//.test(sheet) ? sheet : undefined;
  return <Dashboard initial={initial} connected={appsScriptConfigured()} invitesSource={invitesSource} sheetUrl={sheetUrl} />;
}
