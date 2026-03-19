import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { RunsPage } from "../pages/RunsPage";
import { ResultsPage } from "../pages/ResultsPage";
import { RequireAuth } from "./RequireAuth";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  // Tất cả bên dưới cần login
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },

          // admin + manager
          {
            element: <RequireAuth allowRoles={["admin", "manager"]} />,
            children: [
              { path: "projects", element: <ProjectsPage /> },
              { path: "runs", element: <RunsPage /> },
            ],
          },

          // mọi role đều xem được
          { path: "results", element: <ResultsPage /> },
        ],
      },
    ],
  },
]);