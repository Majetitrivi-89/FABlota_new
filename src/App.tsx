import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import ManufacturerLogin from "./pages/manufacturer/Login";
import ManufacturerSignup from "./pages/manufacturer/Signup";
import RetailerLogin from "./pages/retailer/Login";
import RetailerSignup from "./pages/retailer/Signup";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import AdminLogin from "./pages/super-admin/Login";
import Shop from "./pages/Shop";
import BrandBuilder from "./pages/BrandBuilder";
import Cart from "./pages/Cart";
import ManufacturerDashboard from "./pages/ManufacturerDashboard";
import ManufacturerOrders from "./pages/ManufacturerOrders";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";
import TicTacToe from "./pages/TicTacToe";

const queryClient = new QueryClient();

const appType = import.meta.env.VITE_APP_TYPE;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {appType === 'manufacturer' && (
                <>
                  <Route path="/" element={<Index />} />
                  <Route path="/manufacturer/login" element={<ManufacturerLogin />} />
                  <Route path="/manufacturer/signup" element={<ManufacturerSignup />} />
                  <Route path="/manufacturer" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerDashboard /></ProtectedRoute>} />
                  <Route path="/manufacturer/orders" element={<ProtectedRoute allowedRoles={["manufacturer"]}><ManufacturerOrders /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute allowedRoles={["manufacturer"]}><Profile /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute allowedRoles={["manufacturer"]}><Orders /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/manufacturer/login" replace />} />
                </>
              )}

              {appType === 'retailer' && (
                <>
                  <Route path="/" element={<Index />} />
                  <Route path="/retailer/login" element={<RetailerLogin />} />
                  <Route path="/retailer/signup" element={<RetailerSignup />} />
                  <Route path="/shop" element={<ProtectedRoute allowedRoles={["retailer"]}><Shop /></ProtectedRoute>} />
                  <Route path="/brand-builder" element={<ProtectedRoute allowedRoles={["retailer"]}><BrandBuilder /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute allowedRoles={["retailer"]}><Cart /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute allowedRoles={["retailer"]}><Orders /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute allowedRoles={["retailer"]}><Profile /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["retailer"]}><Dashboard /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/retailer/login" replace />} />
                </>
              )}

              {appType === 'admin' && (
                <>
                  <Route path="/" element={<Navigate to="/super-admin" replace />} />
                  <Route path="/super-admin/login" element={<AdminLogin />} />
                  <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/super-admin/login" replace />} />
                </>
              )}

              {/* Dev fallback if VITE_APP_TYPE is unset */}
              {!appType && (
                <>
                  <Route path="/" element={<Index />} />
                  <Route path="/tictactoe" element={<TicTacToe />} />
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
