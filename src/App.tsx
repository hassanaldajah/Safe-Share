import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FoldersProvider } from "@/components/dashboard/FoldersContext";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import NotFound from "./pages/NotFound";
import MainLayoutWithDash from "./pages/MainLayoutWithDash";
import DashboardHome from "./components/dashboard/DashboardHome";
import { MyFolders } from "./components/dashboard/Myfolders";
import { TrashPage } from "./components/dashboard/Trashpage";
import { AiAssistantPage } from "./components/dashboard/AiAssistantPage";
import { BackupPage } from "./components/dashboard/BackUp";
import { Chatpage } from "./components/dashboard/Chatpage";
import { GroupPage } from './components/dashboard/Group';
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeProvider";
import PaymentSuccess from "./pages/PaymentSuccess";

import PricingPage from "./pages/PricingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="system" storageKey="safeshare-theme">
        <AuthProvider>
          <FoldersProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                <Route element={<MainLayoutWithDash />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/MyFolders" element={<MyFolders />} />
                  <Route path="/trash" element={<TrashPage />} />
                  <Route path="/groups" element={<GroupPage />} />
                  <Route path="/ai-assistant" element={<AiAssistantPage />} />
                  <Route path="/backup" element={<BackupPage />} />
                  <Route path="/chat" element={<Chatpage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<HelpPage />} />
                </Route> 
                
                <Route path="*" element={<NotFound />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
              </Routes>
            </BrowserRouter>
          </FoldersProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;