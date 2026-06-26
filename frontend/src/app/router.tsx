import { Routes, Route } from "react-router-dom"
import { AppShell } from "@/components/shell/AppShell"
import { DashboardPage } from "@/pages/DashboardPage"
import { CaseLibraryPage } from "@/pages/CaseLibraryPage"
import { GeneratePage } from "@/pages/GeneratePage"
import { ReportPage } from "@/pages/ReportPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { EvaluationPage } from "@/pages/EvaluationPage"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-4xl font-mono text-[--zx-muted]">404</p>
        <p className="mb-4 text-sm text-[--zx-muted]">页面未找到</p>
        <Link to="/">
          <Button variant="outline">返回工作台</Button>
        </Link>
      </div>
    </div>
  )
}

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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
