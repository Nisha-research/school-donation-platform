import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, PackageSearch, X, Filter } from 'lucide-react';
import { useRealtimeNeeds } from '@/lib/useRealtimeNeeds';
import type { Category, Priority, NeedStatus } from '@/lib/types';
import { LoadingSpinner, ErrorState } from '@/components/Layout';
import { NeedCard } from '@/components/NeedCard';

const categories: (Category | 'All')[] = ['All', 'Stationery', 'Bags', 'Books', 'Other'];
const priorities: (Priority | 'All')[] = ['All', 'High', 'Medium', 'Low'];
const statuses: (NeedStatus | 'All')[] = ['All', 'Open', 'Partially Fulfilled', 'Closed'];

export function NeedsPage() {
  const { needs, loading, error } = useRealtimeNeeds();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [priority, setPriority] = useState<Priority | 'All'>('All');
  const [status, setStatus] = useState<NeedStatus | 'All'>('All');

  const filtered = useMemo(() => {
    return needs.filter((n) => {
      if (category !== 'All' && n.category !== category) return false;
      if (priority !== 'All' && n.priority !== priority) return false;
      if (status !== 'All' && n.status !== status) return false;
      if (search && !n.item_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [needs, category, priority, status, search]);

  const activeFilterCount =
    (category !== 'All' ? 1 : 0) + (priority !== 'All' ? 1 : 0) + (status !== 'All' ? 1 : 0) + (search ? 1 : 0);

  function clearAll() {
    setSearch('');
    setCategory('All');
    setPriority('All');
    setStatus('All');
  }

  if (loading) return <LoadingSpinner label="Loading school needs..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-navy-900 dark:text-navy-100">School Needs</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Browse all current needs and track donation progress in real time.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              aria-label="Search by item name"
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category:</span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      category === c
                        ? 'bg-navy-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority:</span>
              <div className="flex flex-wrap gap-1.5">
                {priorities.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      priority === p
                        ? 'bg-cta-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      status === s
                        ? 'bg-ocean-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700'
                    }`}
                  >
                    {s === 'All' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active filter chips + clear */}
        {activeFilterCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-navy-700">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ocean-100 px-3 py-1 text-xs font-semibold text-ocean-800 dark:bg-navy-800 dark:text-ocean-300">
                "{search}"
                <button onClick={() => setSearch('')} className="hover:text-ocean-900 dark:hover:text-ocean-200" aria-label="Clear search">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {category !== 'All' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-800 dark:bg-navy-800 dark:text-navy-200">
                {category}
                <button onClick={() => setCategory('All')} className="hover:text-navy-900 dark:hover:text-navy-100" aria-label="Clear category filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {priority !== 'All' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cta-100 px-3 py-1 text-xs font-semibold text-cta-800 dark:bg-navy-800 dark:text-cta-300">
                {priority} Priority
                <button onClick={() => setPriority('All')} className="hover:text-cta-900 dark:hover:text-cta-200" aria-label="Clear priority filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {status !== 'All' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ocean-100 px-3 py-1 text-xs font-semibold text-ocean-800 dark:bg-navy-800 dark:text-ocean-300">
                {status}
                <button onClick={() => setStatus('All')} className="hover:text-ocean-900 dark:hover:text-ocean-200" aria-label="Clear status filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAll}
              className="ml-1 text-xs font-semibold text-slate-600 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="mt-6 text-sm font-medium text-slate-700 dark:text-slate-300">
        Showing {filtered.length} need{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-navy-700">
          <PackageSearch className="h-12 w-12 text-slate-300 dark:text-navy-600" />
          <h3 className="mt-4 font-display text-lg font-semibold text-navy-800 dark:text-navy-200">
            {needs.length === 0 ? 'No needs yet' : 'No needs found'}
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {needs.length === 0
              ? 'School needs will appear here once they are added.'
              : 'Try adjusting your filters or search.'}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="mt-4 rounded-xl bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((need) => (
            <div key={need.id} className="animate-slide-up">
              <NeedCard need={need} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
