import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--zx-stage)",
                color: "var(--zx-canvas)",
                border: "1px solid var(--zx-line)",
              },
            }}
          />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
