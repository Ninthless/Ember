import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "./components/theme-provider"
import App from "./App"
import "./assets/index.css"

const root = document.getElementById("root")
if (!root) {
  throw new Error("缺少根节点")
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <App />
      <Toaster position="top-center" offset={56} />
    </ThemeProvider>
  </StrictMode>
)
