import { Link, Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AlertTriangle } from 'lucide-react';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-ocean-50 dark:bg-navy-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ScrollToTop() {
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
  return null;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/40">
        <AlertTriangle className="h-8 w-8 text-error-600 dark:text-error-400" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold text-navy-900 dark:text-navy-100">Something went wrong</h2>
      <p className="mt-2 text-slate-700 dark:text-slate-300">{message}</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"
      >
        Back to Home
      </Link>
    </div>
  );
}

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-ocean-200 border-t-cta-500 dark:border-navy-700 dark:border-t-cta-500" />
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      </div>
    </div>
  );
}
