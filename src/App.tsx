import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SwissShell } from "@/components/SwissShell";

import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Browse from "./pages/Browse";
import VideoPlayer from "./pages/VideoPlayer";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Creator from "./pages/Creator";
import Admin from "./pages/Admin";
import SignIn from "./pages/SignIn";
import PublicProfile from "./pages/PublicProfile";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Temporary Swiss imports during migration
import SwissDashboard from "./pages/SwissDashboard";
import SwissVideo from "./pages/SwissVideo";
import SwissQuiz from "./pages/SwissQuiz";

const App = () => {
  if (!clerkPubKey) {
    console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Auth features will be disabled.");
    // Dev mode fallback
    return (
      <div className="p-10 text-center font-mono">Missing Clerk Key</div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <Routes>
              {/* Auth Routes (Standalone) */}
              <Route path="/sign-in/*" element={<SignIn />} />
              <Route path="/sign-up/*" element={<SignUp />} />

              {/* Main App Shell */}
              <Route path="/" element={<LandingPage />} />

              <Route element={<SwissShell />}>

                {/* Public */}
                <Route path="/feed" element={<Index />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/video/:id" element={<VideoPlayer />} />

                {/* Protected */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/upload" element={
                  <ProtectedRoute><Upload /></ProtectedRoute>
                } />
                <Route path="/creator" element={
                  <ProtectedRoute><Creator /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute><Admin /></ProtectedRoute>
                } />

                {/* Swiss Prototypes (Keep for reference) */}
                <Route path="/swiss" element={<SwissDashboard />} />
                <Route path="/swiss/video" element={<SwissVideo />} />
                <Route path="/swiss/quiz" element={<SwissQuiz />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
