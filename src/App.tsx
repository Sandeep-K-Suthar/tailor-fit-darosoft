import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CustomizationProvider } from "./context/CustomizationContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Customize from "./pages/Customize";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Customize3D from "./pages/Customize3D";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <CustomizationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/customize/:id" element={<Customize />} />
                  <Route path="/customize-3d/:productType" element={<Customize3D />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </CustomizationProvider>
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
