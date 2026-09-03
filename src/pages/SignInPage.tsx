import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HeartHandshake,
  Lock,
  Mail,
  Loader2,
  ArrowLeft,
  AlertCircle,
  User,
  Shield,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

type RoleTab = 'donor' | 'admin';
type Mode = 'signin' | 'signup';

function containsAdmin(value: string) {
  return /admin/i.test(value.trim());
}

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut, isAdmin, user, loading } = useAuth();
  const [role, setRole] = useState<RoleTab>('donor');
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expectingAdminCheck, setExpectingAdminCheck] = useState(false);

  // Handle redirect after login completes and admin check resolves
  useEffect(() => {
    if (loading || !user) return;
    if (!expectingAdminCheck) return;

    if (role === 'admin') {
      if (isAdmin) {
        setSubmitting(false);
        setExpectingAdminCheck(false);
        navigate('/admin', { replace: true });
      }
      // If isAdmin is false, wait longer—don't sign out yet
      // The admin check may still be loading from the database
    } else {
      setSubmitting(false);
      setExpectingAdminCheck(false);
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    }
  }, [loading, isAdmin, user, navigate, role, expectingAdminCheck]);

  // Timeout for admin check: if we're still waiting after 5 seconds, show error
  useEffect(() => {
    if (!expectingAdminCheck || !user || role !== 'admin' || isAdmin) return;

    const timeout = setTimeout(() => {
      setError('This account is not an admin. Sign in as a donor, or use an admin account.');
      setSubmitting(false);
      setExpectingAdminCheck(false);
      signOut?.();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [expectingAdminCheck, user, role, isAdmin, signOut]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (role === 'admin') {
        setError('Admin accounts cannot be created through public registration.');
        return;
      }
      if (containsAdmin(email) || containsAdmin(name)) {
        setError('Admin accounts cannot be created through public registration.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setSubmitting(true);

    if (mode === 'signup') {
      const result = await signUp(email.trim(), password, name.trim());
      if (result?.error) {
        setError(result.error.message || 'Could not create account. Try a different email.');
        setSubmitting(false);
      }
      return;
    }

    const result = await signIn(email.trim(), password);
    if (result?.error) {
      setError('Invalid email or password. Please try again.');
      setSubmitting(false);
    } else {
      // Signal that we're waiting for the admin check to complete
      setExpectingAdminCheck(true);
    }
  }

  const isSignup = role === 'donor' && mode === 'signup';

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900 dark:text-navy-300 dark:hover:text-navy-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-navy-700 dark:bg-navy-900">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800">
              <HeartHandshake className="h-7 w-7 text-cta-400" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-navy-900 dark:text-navy-100">
              {isSignup ? 'Create your account' : 'Welcome Back'}
            </h1>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {isSignup
                ? 'Register as a donor to pledge items and track deliveries.'
                : role === 'admin'
                  ? 'Sign in with your admin account.'
                  : 'Sign in to pledge donations and track them.'}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-navy-800">
            <button
              type="button"
              onClick={() => {
                setRole('donor');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                role === 'donor'
                  ? 'bg-white text-navy-900 shadow-sm dark:bg-navy-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <User className="h-4 w-4" /> Donor
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setMode('signin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                role === 'admin'
                  ? 'bg-white text-navy-900 shadow-sm dark:bg-navy-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Shield className="h-4 w-4" /> Admin
            </button>
          </div>

          {error && (
            <div
              className="mt-5 flex items-start gap-2 rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-900/30 dark:text-error-400"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-navy-800 dark:text-navy-200">
                  Full name
                </label>
                <div className="relative mt-1.5">
                  <UserPlus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:bo[...]"
                    placeholder="e.g. Priya Sharma"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-navy-800 dark:text-navy-200">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:bord[...]"
                  placeholder={role === 'admin' ? 'admin@schoolcare.com' : 'you@example.com'}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-navy-800 dark:text-navy-200">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:bord[...]"
                  placeholder="••••••••"
                  required
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cta-500 px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-cta-600 hover:shadow-xl d[...]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isSignup ? 'Creating account...' : 'Signing in...'}
                </>
              ) : isSignup ? (
                'Create account'
              ) : role === 'admin' ? (
                'Sign in as Admin'
              ) : (
                'Sign in as Donor'
              )}
            </button>
          </form>

          {role === 'donor' && (
            <p className="mt-5 text-center text-sm text-slate-700 dark:text-slate-300">
              {mode === 'signin' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="font-semibold text-cta-700 hover:underline dark:text-cta-400"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="font-semibold text-cta-700 hover:underline dark:text-cta-400"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
