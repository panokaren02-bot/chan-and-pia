import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";
import Login from "@/components/dashboard/Login";
import { isAuthed, passwordConfigured } from "@/lib/auth";
import { appsScriptConfigured } from "@/lib/appsScript";
import { getContent } from "@/lib/content";
import "./dashboard.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  if (!(await isAuthed())) return <Login configured={passwordConfigured()} />;
  const content = await getContent({ fresh: true });
  return <Dashboard initial={content} connected={appsScriptConfigured()} />;
}
