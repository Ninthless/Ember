import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./assets/index.css"

const root = document.getElementById("root")
if (!root) {
  throw new Error("缺少根节点")
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
