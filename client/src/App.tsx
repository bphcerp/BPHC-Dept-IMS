import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/views/Home";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/Auth";
import { GOOGLE_CLIENT_ID } from "@/lib/constants";
import ProtectedLayout from "@/layouts/Protected";
import Admin from "@/views/Admin";
import AdminLayout from "@/layouts/Admin";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <BrowserRouter
            // react-router future version flags, prevents console warnings
            future={{
              v7_relativeSplatPath: true,
              v7_startTransition: true,
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              {/* Protected Routes (requires authentication) */}
              <Route path="/" element={<ProtectedLayout />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<Admin />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
