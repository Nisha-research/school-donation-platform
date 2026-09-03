import { DonationTracker } from '@/components/DonationTracker';
import { Search } from 'lucide-react';

export function TrackDonationPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800">
          <Search className="h-7 w-7 text-cta-400" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-navy-900 dark:text-navy-100">Track Your Donation</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Enter the email you used when pledging to see all your donations and their current status.
        </p>
      </div>
      <div className="mt-8">
        <DonationTracker />
      </div>
    </div>
  );
}
