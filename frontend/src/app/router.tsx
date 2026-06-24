import { Routes, Route } from "react-router-dom"
import { AppShell } from "@/components/shell/AppShell"
import { DashboardPage } from "@/pages/DashboardPage"
import { CaseLibraryPage } from "@/pages/CaseLibraryPage"
import { GeneratePage } from "@/pages/GeneratePage"
import { ReportPage } from "@/pages/ReportPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { EvaluationPage } from "@/pages/EvaluationPage"

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cases" element={<CaseLibraryPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/reports/:id" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/evaluation" element={<EvaluationPage />} />
      </Route>
    </Routes>
  )
}
