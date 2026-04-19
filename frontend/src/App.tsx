import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryProvider } from "@/context/QueryContext";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SubmitQuery from "./pages/SubmitQuery";
import MyQueries from "./pages/MyQueries";
import QueryDetail from "./pages/QueryDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import { RequireUser } from "./components/RequireUser";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const DashboardRoute = () => {
  const { userRole } = useAuth();
  console.log('DashboardRoute - userRole:', userRole);

  if (userRole === 'admin') {
    console.log('Rendering AdminDashboard');
    return <AdminDashboard />;
  }

  console.log('Rendering User Dashboard');
  return <Dashboard />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="resolvex-theme">
        <TooltipProvider>
          <AuthProvider>
            <QueryProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  <Route element={<RequireAuth />}>
                    <Route path="/" element={<DashboardRoute />} />

                    {/* User-only routes */}
                    <Route path="/submit" element={<RequireUser><SubmitQuery /></RequireUser>} />
                    <Route path="/queries" element={<RequireUser><MyQueries /></RequireUser>} />

                    {/* Shared route - both admin and user can access */}
                    <Route path="/queries/:id" element={<QueryDetail />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </QueryProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
