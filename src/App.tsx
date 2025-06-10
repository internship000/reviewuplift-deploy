import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import Navbar from "./components/Navbar";
import LoginForm from "./components/Login";
import RegistrationForm from "./components/Register";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Demo from "./components/demo";

import PaymentPage from "./components/Paymentpage";
import ContactWidget from "./components/ContactWidget";
import BusinessDashboard from "./components/business/dashboard/page";
import BusinessReviews from "./components/business/reviews/page";
import ReviewLinkPage from "./components/business/review-link/page";
import AdminDashboard from "./components/admin/dashboard/page";
import BusinessesPage from "./components/admin/business/page";
import UsersPage from "./components/admin/users/page";
import Sidebar from "./components/sidebar";
import BusinessForm from "./components/Business-form";
import AccountPage from "./components/business/settings/account";
import BusinessUsersPage from "./components/business/settings/businessusers";
import LocationPage from "./components/business/settings/location";
import AnalyticsPage from "./components/admin/analytics/page";

import ReviewPage from "./components/business/review-link/review";
import AdminRegistrationForm from "./components/admin/register/page";
import BusinessDetailsPage from "./components/admin/business/[uid]";
import SubscriptionPage from "./components/admin/subscriptions/[uid]";
import AnalyticPage from "./components/business/analytics/analytics";

function useScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);
}

function AppRoutes() {
  useScrollToHash();
  const location = useLocation();

const currentPath = location.pathname;

// Hide navbar for /review, /feedback, or any single-segment slug like /demo123
const shouldHideNavbar = /^\/[^\/]+$/.test(currentPath) || ["/review", "/feedback"].includes(currentPath);

return (
    <>
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/contact" element={<ContactWidget />} />
        <Route path="/pricing" element={<Index />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/admin" element={<BusinessForm />} />
        <Route path="/businessform" element={<BusinessForm />} />
        <Route path="/components/business/dashboard" element={<BusinessDashboard />} />
        <Route path="/components/business/reviews" element={<BusinessReviews />} />
        <Route path="/components/business/review-link" element={<ReviewLinkPage />} />

        <Route path="/components/business/analytics" element={<AnalyticPage />} />


        <Route path="/components/business/settings/account" element={<AccountPage />} />
        <Route path="/components/business/settings/businessusers" element={<BusinessUsersPage />} />
        <Route path="/components/business/settings/location" element={<LocationPage />} />
        <Route path="/components/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/components/admin/businesses" element={<BusinessesPage />} />
        <Route path="/components/admin/users" element={<UsersPage />} />
        <Route path="/components/admin/register" element={<AdminRegistrationForm />} />
        <Route path="/components/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/businesses/:uid" element={<BusinessDetailsPage params={{ uid: "" }} />} />
        <Route path="/admin/subscriptions/:uid" element={<SubscriptionPage params={{ uid: "" }} />} />
        <Route path="/sidebar" element={<Sidebar />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/:businessSlug" element={<ReviewPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
