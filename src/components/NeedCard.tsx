import { Link } from 'react-router-dom';
import { Package, HandHeart } from 'lucide-react';
import type { SchoolNeed } from '@/lib/types';
import { ProgressBar } from './ProgressBar';
import { NeedStatusBadge, PriorityBadge } from './Badges';
import { remainingReceive } from '@/lib/format';

export function NeedCard({ need }: { need: SchoolNeed }) {
  const remaining = remainingReceive(need.quantity_received, need.quantity_required);
  const isClosed = need.status === 'Closed';

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-navy-700 dark:bg-navy-900">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-ocean-50 to-white px-5 py-4 dark:border-navy-700 dark:from-navy-800 dark:to-navy-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-white">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold leading-tight text-navy-900 dark:text-navy-100">
              {need.item_name}
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{need.category}</p>
          </div>
        </div>
        <PriorityBadge priority={need.priority} />
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        {need.description && (
          <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">{need.description}</p>
        )}

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-400">Required</span>
          <span className="font-display text-lg font-bold text-navy-900 dark:text-navy-100">{need.quantity_required}</span>
        </div>

        <ProgressBar
          pledged={need.quantity_pledged}
          received={need.quantity_received}
          required={need.quantity_required}
        />

        {/* Prominent "still needed" number */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-cta-50 px-4 py-3 dark:bg-navy-800">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Still needed</span>
          <span className={`font-display text-2xl font-extrabold ${remaining > 0 ? 'text-cta-700 dark:text-cta-400' : 'text-success-700 dark:text-success-400'}`}>
            {remaining > 0 ? remaining : 'Fulfilled'}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <NeedStatusBadge status={need.status} />
        </div>
      </div>

      <div className="px-5 pb-5">
        {isClosed ? (
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500 dark:bg-navy-800 dark:text-slate-500"
          >
            <HandHeart className="h-4 w-4" />
            Fully Fulfilled
          </button>
        ) : (
          <Link
            to={`/donate/${need.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cta-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-cta-600 hover:shadow-lg"
          >
            <HandHeart className="h-4 w-4" />
            Donate This
          </Link>
        )}
      </div>
    </div>
  );
}
