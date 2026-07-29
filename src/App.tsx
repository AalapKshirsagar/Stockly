import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AlertsPage } from "./pages/AlertsPage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <AnalyzePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
