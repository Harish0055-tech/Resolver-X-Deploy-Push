import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { QueryProvider } from "@/context/QueryContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SubmitQuery from "./pages/SubmitQuery";
import MyQueries from "./pages/MyQueries";
import QueryDetail from "./pages/QueryDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";

import RequireAuth from "./components/RequireAuth";
import { RequireUser } from "./components/RequireUser";
import { ThemeProvider } from "./components/theme-provider";

/* 🔥 NEW: Global Layout Wrapper */
const AppLayout = ({ children })=> {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#020617] text-gray-200">
      {/* Container for consistent spacing */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

/* 🔥 Cleaner Role-Based Routing */
const DashboardRoute = () => {
  const { userRole } = useAuth();

  return userRole === "admin" ? <AdminDashboard /> : <Dashboard />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 🔥 Force premium dark theme by default */}
      <ThemeProvider defaultTheme="dark" storageKey="resolvex-theme">
        <TooltipProvider>
          <AuthProvider>
            <QueryProvider>
              {/* 🔥 Toast styling upgrade */}
              <Toaster />
              <Sonner richColors position="top-right" />

              <BrowserRouter>
                <Routes>
                  {/* 🔓 Public Routes */}
                  <Route
                    path="/login"
                    element={
                      <AppLayout>
                        <Login />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <AppLayout>
                        <Register />
                      </AppLayout>
                    }
                  />

                  {/* 🔐 Protected Routes */}
                  <Route element={<RequireAuth />}>
                    <Route
                      path="/"
                      element={
                        <AppLayout>
                          <DashboardRoute />
                        </AppLayout>
                      }
                    />

                    {/* 👤 User Routes */}
                    <Route
                      path="/submit"
                      element={
                        <AppLayout>
                          <RequireUser>
                            <SubmitQuery />
                          </RequireUser>
                        </AppLayout>
                      }
                    />

                    <Route
                      path="/queries"
                      element={
                        <AppLayout>
                          <RequireUser>
                            <MyQueries />
                          </RequireUser>
                        </AppLayout>
                      }
                    />

                    {/* 🔁 Shared */}
                    <Route
                      path="/queries/:id"
                      element={
                        <AppLayout>
                          <QueryDetail />
                        </AppLayout>
                      }
                    />
                  </Route>

                  {/* ❌ Not Found */}
                  <Route
                    path="*"
                    element={
                      <AppLayout>
                        <NotFound />
                      </AppLayout>
                    }
                  />
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