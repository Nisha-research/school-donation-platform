import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { NeedsPage } from '@/pages/NeedsPage';
import { DonationFormPage } from '@/pages/DonationFormPage';
import { SuccessPage } from '@/pages/SuccessPage';
import { SurveyPage } from '@/pages/SurveyPage';
import { SignInPage } from '@/pages/SignInPage';
import { TrackDonationPage } from '@/pages/TrackDonationPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { LoadingSpinner } from '@/components/Layout';

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner label="Checking access..." />;
  if (!isAdmin) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTopOnNavigate />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/needs" element={<NeedsPage />} />
            <Route path="/donate/:needId" element={<DonationFormPage />} />
            <Route path="/success/:donationId" element={<SuccessPage />} />
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/track" element={<TrackDonationPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
