import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<div className="text-white p-8">ZhiXi Dashboard</div>} />
            <Route path="/cases" element={<div className="text-white p-8">Case Library</div>} />
            <Route path="/generate" element={<div className="text-white p-8">Smart Generate</div>} />
            <Route path="/reports/:id" element={<div className="text-white p-8">Report</div>} />
            <Route path="/settings" element={<div className="text-white p-8">Settings</div>} />
            <Route path="/evaluation" element={<div className="text-white p-8">Evaluation</div>} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
