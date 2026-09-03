import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, HandHeart, Package, AlertCircle, Loader2, Info } from 'lucide-react';
import { fetchNeedById, createDonation } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { SchoolNeed } from '@/lib/types';
import { ProgressBar } from '@/components/ProgressBar';
import { NeedStatusBadge, PriorityBadge } from '@/components/Badges';
import { LoadingSpinner, ErrorState } from '@/components/Layout';

interface FormErrors {
  donor_name?: string;
  email?: string;
  phone?: string;
  quantity?: string;
}

export function DonationFormPage() {
  const { needId } = useParams<{ needId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [need, setNeed] = useState<SchoolNeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (!needId) return;
    (async () => {
      try {
        const data = await fetchNeedById(needId);
        setNeed(data);
      } catch {
        setNeed(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [needId]);

  // Subscribe to realtime updates for this need
  useEffect(() => {
    if (!needId) return;

    const subscription = supabase
      .channel(`school_needs:id=eq.${needId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_needs',
          filter: `id=eq.${needId}`,
        },
        (payload) => {
          if (payload.new) {
            setNeed(payload.new as SchoolNeed);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [needId]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!donorName.trim()) e.donor_name = 'Please enter your name.';
    if (!email.trim()) e.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Please enter a valid email.';
    if (!phone.trim()) e.phone = 'Please enter your phone number.';
    else if (!/^[\d\s+()-]{7,15}$/.test(phone.trim())) e.phone = 'Please enter a valid phone number.';
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty)) e.quantity = 'Please enter a quantity.';
    else if (qty < 1) e.quantity = 'Quantity must be at least 1.';
    else if (need && qty > Math.max(0, need.quantity_required - need.quantity_received))
      e.quantity = `Only ${Math.max(0, need.quantity_required - need.quantity_received)} more needed.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!need || !validate()) return;

    setSubmitting(true);
    try {
      const donation = await createDonation({
        donor_name: donorName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        school_need_id: need.id,
        quantity: parseInt(quantity, 10),
        user_id: user?.id ?? null,
      });
      navigate(`/success/${donation.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading need details..." />;
  if (!need) return <ErrorState message="The requested need could not be found." />;

  const remaining = Math.max(0, need.quantity_required - need.quantity_received);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/needs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800 dark:text-navy-300 dark:hover:text-navy-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Needs
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Need summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-navy-900 dark:text-navy-100">{need.item_name}</h2>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{need.category}</p>
              </div>
            </div>

            {need.description && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{need.description}</p>
            )}

            <div className="mt-4 flex gap-2">
              <PriorityBadge priority={need.priority} />
              <NeedStatusBadge status={need.status} />
            </div>

            <div className="mt-4">
              <ProgressBar
                pledged={need.quantity_pledged}
                received={need.quantity_received}
                required={need.quantity_required}
              />
            </div>

            <div className="mt-4 rounded-xl bg-ocean-50 p-3 text-center dark:bg-navy-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Still needed</p>
              <p className="font-display text-2xl font-bold text-navy-900 dark:text-navy-100">{remaining}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
            <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-navy-100">Pledge a Donation</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Fill in your details below. No account needed.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-ocean-50 p-3 text-sm text-navy-700 dark:bg-navy-800 dark:text-navy-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ocean-600 dark:text-ocean-400" />
              <span>You will receive updates when your donation status changes. Check back using your email.</span>
            </div>

            {formError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-900/30 dark:text-error-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="donor_name" className="block text-sm font-semibold text-navy-800 dark:text-navy-200">
                  Your Name <span className="text-error-500">*</span>
                </label>
                <input
                  id="donor_name"
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:ring-1 dark:bg-navy-800 dark:text-white ${
                    errors.donor_name ? 'border-error-400 focus:border-error-500 focus:ring-error-500' : 'border-slate-300 focus:border-cta-500 focus:ring-cta-500 dark:border-navy-600'
                  }`}
                  placeholder="e.g. Priya Sharma"
                  aria-invalid={!!errors.donor_name}
                />
                {errors.donor_name && <p className="mt-1 text-xs text-error-600">{errors.donor_name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-navy-800 dark:text-navy-200">
                  Email <span className="text-error-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:ring-1 dark:bg-navy-800 dark:text-white ${
                    errors.email ? 'border-error-400 focus:border-error-500 focus:ring-error-500' : 'border-slate-300 focus:border-cta-500 focus:ring-cta-500 dark:border-navy-600'
                  }`}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="mt-1 text-xs text-error-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-navy-800 dark:text-navy-200">
                  Phone <span className="text-error-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:ring-1 dark:bg-navy-800 dark:text-white ${
                    errors.phone ? 'border-error-400 focus:border-error-500 focus:ring-error-500' : 'border-slate-300 focus:border-cta-500 focus:ring-cta-500 dark:border-navy-600'
                  }`}
                  placeholder="+91 98765 43210"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="mt-1 text-xs text-error-600">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-navy-800 dark:text-navy-200">
                  Quantity to Donate <span className="text-error-500">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={remaining}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:ring-1 dark:bg-navy-800 dark:text-white ${
                    errors.quantity ? 'border-error-400 focus:border-error-500 focus:ring-error-500' : 'border-slate-300 focus:border-cta-500 focus:ring-cta-500 dark:border-navy-600'
                  }`}
                  placeholder={`Max ${remaining}`}
                  aria-invalid={!!errors.quantity}
                />
                {errors.quantity ? (
                  <p className="mt-1 text-xs text-error-600">{errors.quantity}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Up to {remaining} needed</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || remaining <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cta-500 px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-cta-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
                ) : (
                  <><HandHeart className="h-5 w-5" /> Pledge Donation</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
