import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Clock,
  Mail,
  Phone,
  User,
  ClipboardList,
  Info,
  MapPin,
  PackageCheck,
  ClipboardCheck,
  Truck,
  Download,
} from 'lucide-react';
import { fetchDonationById, fetchDonationHistory } from '@/lib/data';
import type { DonationWithNeed, DonationHistoryEntry, DonationStatus } from '@/lib/types';
import { LoadingSpinner, ErrorState } from '@/components/Layout';
import { DonationStatusBadge } from '@/components/Badges';
import { SchoolMap } from '@/components/SchoolMap';
import { DonationTracker } from '@/components/DonationTracker';
import { formatDate, formatDateTime, donationStatusStep } from '@/lib/format';
import { generateReceipt } from '@/lib/receipt';

const journeySteps: { status: DonationStatus; label: string; desc: string }[] = [
  { status: 'Pledged', label: 'Pledged', desc: 'Your donation has been recorded.' },
  { status: 'Confirmed', label: 'Confirmed', desc: 'Your pledge has been confirmed by the school.' },
  { status: 'Collected', label: 'Received by School', desc: 'Items have been received at the school.' },
  { status: 'Delivered', label: 'Delivered to Students', desc: 'Items have been distributed to students.' },
];

const stepIcons: Record<DonationStatus, typeof Clock> = {
  Pledged: Clock,
  Confirmed: ClipboardCheck,
  Collected: PackageCheck,
  Delivered: Truck,
  Completed: CheckCircle2,
};

export function SuccessPage() {
  const { donationId } = useParams<{ donationId: string }>();
  const [donation, setDonation] = useState<DonationWithNeed | null>(null);
  const [history, setHistory] = useState<DonationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!donationId) return;
    (async () => {
      try {
        const [d, h] = await Promise.all([
          fetchDonationById(donationId),
          fetchDonationHistory(donationId),
        ]);
        setDonation(d);
        setHistory(h);
      } catch {
        // fall through to error
      } finally {
        setLoading(false);
      }
    })();
  }, [donationId]);

  if (loading) return <LoadingSpinner label="Loading your donation..." />;
  if (!donation) return <ErrorState message="Donation not found." />;

  const currentStep = donationStatusStep[donation.status];
  const school = donation.school_need?.school;

  // Map history entries to journey steps
  const stepTimestamps: Partial<Record<DonationStatus, string>> = {};
  for (const h of history) {
    if (!stepTimestamps[h.to_status]) {
      stepTimestamps[h.to_status] = h.changed_at;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Animated checkmark */}
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-ring rounded-full bg-success-200" />
            <div className="relative flex h-24 w-24 animate-check-pop items-center justify-center rounded-full bg-success-500">
              <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path
                  className="animate-draw-check"
                  d="M5 13l4 4L19 7"
                  style={{ strokeDasharray: 48, strokeDashoffset: 0 }}
                />
              </svg>
            </div>
          </div>
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-navy-900 dark:text-navy-100">Donation Pledged!</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Thank you, {donation.donor_name}. Your pledge has been recorded successfully.
        </p>
      </div>

      {/* Download Receipt button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => generateReceipt(donation)}
          className="flex items-center gap-2 rounded-xl bg-navy-800 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-navy-700 hover:shadow-lg"
        >
          <Download className="h-4 w-4" />
          Download Receipt
        </button>
      </div>

      {/* Donation summary card */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
        <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Donation Summary</h2>

        <div className="mt-4 flex items-center gap-4 rounded-xl bg-ocean-50 p-4 dark:bg-navy-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-white">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-navy-900 dark:text-navy-100">
              {donation.quantity} × {donation.school_need?.item_name ?? 'Item'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{donation.school_need?.category}</p>
          </div>
          <DonationStatusBadge status={donation.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Donor</dt>
              <dd className="font-semibold text-navy-900 dark:text-navy-200">{donation.donor_name}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Date</dt>
              <dd className="font-semibold text-navy-900 dark:text-navy-200">{formatDate(donation.donation_date)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Email</dt>
              <dd className="font-semibold text-navy-900 dark:text-navy-200">{donation.email}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Phone</dt>
              <dd className="font-semibold text-navy-900 dark:text-navy-200">{donation.phone}</dd>
            </div>
          </div>
        </dl>
      </div>

      {/* School location map */}
      {school && (
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cta-500" />
            <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">School Location</h2>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{school.name}</p>
          {school.address && <p className="text-xs text-slate-600 dark:text-slate-400">{school.address}</p>}
          <div className="mt-4">
            <SchoolMap school={school} height="280px" />
          </div>
        </div>
      )}

      {/* 4-stage status journey */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
        <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Donation Journey</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Track your donation from pledge to delivery.</p>

        <div className="mt-5">
          {journeySteps.map((step, i) => {
            const stepNum = donationStatusStep[step.status];
            const isDone = stepNum <= currentStep;
            const isCurrent = stepNum === currentStep;
            const isLast = i === journeySteps.length - 1;
            const Icon = stepIcons[step.status];
            const timestamp = stepTimestamps[step.status];

            return (
              <div key={step.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isDone
                        ? 'border-success-500 bg-success-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400 dark:border-navy-600 dark:bg-navy-800'
                    } ${isCurrent ? 'ring-4 ring-success-200 dark:ring-success-900/50' : ''}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`my-1 h-14 w-0.5 ${isDone ? 'bg-success-400' : 'bg-slate-200 dark:bg-navy-700'}`} />
                  )}
                </div>
                <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                  <p className={`font-bold ${isDone ? 'text-navy-900 dark:text-navy-100' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-sm ${isDone ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                    {step.desc}
                  </p>
                  {timestamp && (
                    <p className="mt-0.5 text-xs font-medium text-success-700 dark:text-success-400">
                      {formatDateTime(timestamp)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* History entries */}
        {history.length > 1 && (
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-navy-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status History</p>
            <ul className="mt-2 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cta-400" />
                  <div>
                    <span className="font-semibold text-navy-800 dark:text-navy-200">{h.to_status}</span>
                    {h.note && <span className="text-slate-600 dark:text-slate-400"> — {h.note}</span>}
                    <span className="block text-xs text-slate-500 dark:text-slate-500">{formatDateTime(h.changed_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Info message */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-ocean-50 p-5 dark:bg-navy-800">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-ocean-600 dark:text-ocean-400" />
        <div className="text-sm text-navy-800 dark:text-navy-200">
          <p className="font-semibold">You will receive updates when your donation status changes.</p>
          <p className="mt-1 text-slate-700 dark:text-slate-300">
            Check back anytime using your email to see the latest status of your donations — no account needed.
          </p>
        </div>
      </div>

      {/* Email-based Donation Tracker */}
      <div className="mt-6">
        <DonationTracker />
      </div>

      {/* Action links */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/needs"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy-800 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-navy-700"
        >
          <ClipboardList className="h-4 w-4" />
          View All Needs
        </Link>
        <Link
          to="/survey"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-navy-200 px-6 py-3 text-sm font-semibold text-navy-800 transition-all hover:bg-ocean-50 dark:border-navy-600 dark:text-navy-200 dark:hover:bg-navy-800"
        >
          Survey Report
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}