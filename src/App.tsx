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
import NotFound from "./pages/NotFound";
import MainLayoutWithDash from "./pages/MainLayoutWithDash";
import DashboardHome from "./components/dashboard/DashboardHome";
import { MyFolders } from "./components/dashboard/Myfolders";
import { TrashPage } from "./components/dashboard/Trashpage";
import { AiAssistantPage } from "./components/dashboard/AiAssistantPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FoldersProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route element={<MainLayoutWithDash />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/MyFolders" element={<MyFolders />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
            </Route> 
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FoldersProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;