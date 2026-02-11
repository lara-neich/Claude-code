import { createBrowserRouter } from "react-router"
import Overview from "./pages/Overview"
import InsightDetail from "./pages/InsightDetail"

export const router = createBrowserRouter([
  { path: "/", Component: Overview },
  { path: "/insight/:insightId", Component: InsightDetail },
])
