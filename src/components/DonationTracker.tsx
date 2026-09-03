import { useState } from 'react';
import { Search, Mail, Loader2, Clock, ClipboardCheck, Package, Truck, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { fetchDonationsByEmail } from '@/lib/data';
import type { DonationWithNeed, DonationStatus } from '@/lib/types';
import { DonationStatusBadge } from '@/components/Badges';
import { formatDate, formatDateTime, donationStatusStep } from '@/lib/format';
import { generateReceipt } from '@/lib/receipt';

const stepIcons: Record<DonationStatus, typeof Clock> = {
  Pledged: Clock,
  Confirmed: ClipboardCheck,
  Collected: Package,
  Delivered: Truck,
  Completed: CheckCircle2,
};

const publicSteps: { status: DonationStatus; label: string }[] = [
  { status: 'Pledged', label: 'Pledged' },
  { status: 'Confirmed', label: 'Confirmed' },
  { status: 'Collected', label: 'Received by School' },
  { status: 'Delivered', label: 'Delivered to Students' },
];

export function DonationTracker() {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<DonationWithNeed[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const donations = await fetchDonationsByEmail(email);
      setResults(donations);
    } catch {
      setError('Could not look up donations. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-cta-500" />
        <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Track Your Donation</h2>
      </div>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
        Enter the email you used when pledging to see all your donations and their current status.
      </p>

      <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
            placeholder="you@example.com"
            required
            aria-label="Email address"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-cta-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cta-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Track
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-900/30 dark:text-error-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {searched && !loading && !error && results !== null && (
        <div className="mt-5">
          {results.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-ocean-50 p-8 text-center dark:bg-navy-800">
              <Package className="h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                No donations found for this email.
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Make sure you used the same email when pledging.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-navy-800 dark:text-navy-200">
                Found {results.length} donation{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((donation) => {
                const currentStep = donationStatusStep[donation.status];
                return (
                  <div key={donation.id} className="rounded-xl border border-slate-200 p-4 dark:border-navy-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-base font-bold text-navy-900 dark:text-navy-100">
                          {donation.quantity} × {donation.school_need?.item_name ?? 'Item'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(donation.donation_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateReceipt(donation)}
                          className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
                          title="Download receipt"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                        <DonationStatusBadge status={donation.status} />
                      </div>
                    </div>

                    {/* 4-stage journey */}
                    <div className="mt-4 flex items-center justify-between">
                      {publicSteps.map((step, i) => {
                        const stepNum = donationStatusStep[step.status];
                        const Icon = stepIcons[step.status];
                        const isDone = stepNum <= currentStep;
                        const isCurrent = stepNum === currentStep;
                        const isLast = i === publicSteps.length - 1;
                        return (
                          <div key={step.status} className="flex flex-1 flex-col items-center">
                            <div className="flex w-full items-center">
                              {i > 0 && (
                                <div className={`h-1 flex-1 rounded-full ${stepNum <= currentStep ? 'bg-success-400' : 'bg-slate-200 dark:bg-navy-700'}`} />
                              )}
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                  isDone
                                    ? 'border-success-500 bg-success-500 text-white'
                                    : 'border-slate-300 bg-white text-slate-400 dark:border-navy-600 dark:bg-navy-800'
                                } ${isCurrent ? 'ring-4 ring-success-200 dark:ring-success-900/50' : ''}`}
                              >
                                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                              </div>
                              {!isLast && (
                                <div className={`h-1 flex-1 rounded-full ${stepNum < currentStep ? 'bg-success-400' : 'bg-slate-200 dark:bg-navy-700'}`} />
                              )}
                            </div>
                            <span className={`mt-2 text-center text-xs font-semibold ${isDone ? 'text-navy-800 dark:text-navy-200' : 'text-slate-400'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Status message */}
                    {donation.status !== 'Pledged' && (
                      <div className="mt-3 rounded-lg bg-ocean-50 px-3 py-2 text-xs text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                        {donation.status === 'Confirmed' && (
                          <span>Your donation has been <strong>Confirmed</strong> by the school.</span>
                        )}
                        {donation.status === 'Collected' && (
                          <span>Your items were <strong>Received by the School</strong> — thank you!</span>
                        )}
                        {donation.status === 'Delivered' && (
                          <span>Your items were <strong>Delivered to Students</strong>. You made a difference!</span>
                        )}
                        {donation.status === 'Completed' && (
                          <span>Your donation is <strong>Completed</strong>. Thank you for your generosity!</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
