import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  HandHeart,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  PackageCheck,
  ClipboardList,
  ClipboardCheck,
  Truck,
  Download,
  BarChart3,
} from 'lucide-react';
import {
  Chart,
  BarController,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import type { Chart as ChartJS } from 'chart.js';
import { useAuth } from '@/lib/auth';
import {
  fetchDonationsWithNeeds,
  updateDonationStatus,
  deleteNeed,
} from '@/lib/data';
import { useRealtimeNeeds } from '@/lib/useRealtimeNeeds';
import type { SchoolNeed, DonationWithNeed, DonationStatus } from '@/lib/types';
import { LoadingSpinner } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { DonationStatusBadge, NeedStatusBadge, PriorityBadge } from '@/components/Badges';
import { formatDate, donationStatusColors, donationStatusOrder } from '@/lib/format';
import { NeedFormModal } from '@/components/NeedFormModal';
import { supabase } from '@/lib/supabase';

Chart.register(
  BarController,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
);

type Tab = 'overview' | 'donations' | 'needs';

export function AdminDashboardPage() {
  const { isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const { needs, refetch: refetchNeeds } = useRealtimeNeeds(false);
  const [donations, setDonations] = useState<DonationWithNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState<SchoolNeed | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const itemsBarRef = useRef<HTMLCanvasElement>(null);
  const categoryDoughnutRef = useRef<HTMLCanvasElement>(null);
  const itemsChartRef = useRef<ChartJS | null>(null);
  const categoryChartRef = useRef<ChartJS | null>(null);

  const loadDonations = useCallback(async () => {
    try {
      const d = await fetchDonationsWithNeeds();
      setDonations(d);
    } catch {
      // ignore — auth gate handles redirect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      void loadDonations();
      void refetchNeeds();
    }
  }, [isAdmin, loadDonations, refetchNeeds]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('admin_donations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => {
          void loadDonations();
          setLastUpdate(Date.now());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'school_needs' },
        () => { setLastUpdate(Date.now()); }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, loadDonations]);

  // Charts
  useEffect(() => {
    if (loading || needs.length === 0) return;

    const categoryColors: Record<string, string> = {
      Stationery: '#C55A11',
      Bags: '#2E75B6',
      Books: '#2f8138',
      Other: '#d18d1a',
    };

    // Most requested items bar chart
    if (itemsBarRef.current) {
      itemsChartRef.current?.destroy();
      const sorted = [...needs].sort((a, b) => b.quantity_required - a.quantity_required).slice(0, 8);

      itemsChartRef.current = new Chart(itemsBarRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map((n) => n.item_name),
          datasets: [
            {
              label: 'Required',
              data: sorted.map((n) => n.quantity_required),
              backgroundColor: '#1F3864',
              borderRadius: 4,
              barPercentage: 0.6,
            },
            {
              label: 'Received',
              data: sorted.map((n) => n.quantity_received),
              backgroundColor: '#2f8138',
              borderRadius: 4,
              barPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } },
          },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { color: '#eef2f8' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          },
        },
      });
    }

    // Fulfilment by category doughnut chart
    if (categoryDoughnutRef.current) {
      categoryChartRef.current?.destroy();
      const categories = [...new Set(needs.map((n) => n.category))];
      const requiredByCat = categories.map(
        (c) => needs.filter((n) => n.category === c).reduce((s, n) => s + n.quantity_required, 0)
      );

      categoryChartRef.current = new Chart(categoryDoughnutRef.current, {
        type: 'doughnut',
        data: {
          labels: categories,
          datasets: [
            {
              data: requiredByCat,
              backgroundColor: categories.map((c) => categoryColors[c] ?? '#64748b'),
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} items required`,
              },
            },
          },
        },
      });
    }

    return () => {
      itemsChartRef.current?.destroy();
      categoryChartRef.current?.destroy();
    };
  }, [needs, loading]);

  if (authLoading || (!isAdmin && loading)) return <LoadingSpinner label="Checking access..." />;
  if (!isAdmin) return null;

  const openNeeds = needs.filter((n) => n.status !== 'Closed').length;
  const totalDonations = donations.length;
  const totalRequired = needs.reduce((s, n) => s + n.quantity_required, 0);
  const totalReceived = needs.reduce((s, n) => s + n.quantity_received, 0);
  const fulfilmentRate = totalRequired > 0 ? Math.round((totalReceived / totalRequired) * 100) : 0;

  const pendingCount = donations.filter((d) => d.status === 'Pledged').length;
  const confirmedCount = donations.filter((d) => d.status === 'Confirmed').length;
  const collectedCount = donations.filter((d) => d.status === 'Collected').length;
  const deliveredCount = donations.filter((d) => d.status === 'Delivered').length;
  const completedCount = donations.filter((d) => d.status === 'Completed').length;

  async function handleStatusChange(donationId: string, newStatus: DonationStatus) {
    setStatusUpdating(donationId);
    try {
      await updateDonationStatus(donationId, newStatus);
      await loadDonations();
      await refetchNeeds();
    } catch {
      // error
    } finally {
      setStatusUpdating(null);
    }
  }

  async function handleDeleteNeed(id: string) {
    if (!confirm('Delete this need? This will also delete all related donations.')) return;
    try {
      await deleteNeed(id);
      await refetchNeeds();
      await loadDonations();
    } catch {
      // ignore
    }
  }

  function openEdit(need: SchoolNeed) {
    setEditingNeed(need);
    setModalOpen(true);
  }

  function openAdd() {
    setEditingNeed(null);
    setModalOpen(true);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function exportCSV() {
    const headers = ['Donor Name', 'Email', 'Phone', 'Item', 'Quantity', 'Status', 'Date'];
    const rows = donations.map((d) => [
      `"${d.donor_name}"`,
      `"${d.email}"`,
      `"${d.phone}"`,
      `"${d.school_need?.item_name ?? 'N/A'}"`,
      d.quantity,
      d.status,
      formatDate(d.donation_date),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donors-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusOptions: DonationStatus[] = donationStatusOrder;
  const statusIcons: Record<DonationStatus, typeof Clock> = {
    Pledged: Clock,
    Confirmed: ClipboardCheck,
    Collected: PackageCheck,
    Delivered: Truck,
    Completed: CheckCircle2,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900 dark:text-navy-100">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Manage needs, track donations, and update statuses.</p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-success-700 dark:text-success-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
            </span>
            Live updates enabled
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={donations.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
          >
            <Download className="h-4 w-4" /> Export Donors
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-cta-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cta-600"
          >
            <Plus className="h-4 w-4" /> Add Need
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Needs" value={openNeeds} icon="package" accent="navy" />
        <StatCard label="Total Donations" value={totalDonations} icon="heart" accent="cta" />
        <StatCard label="Fulfilment Rate" value={`${fulfilmentRate}%`} icon="trending" accent="ocean" sublabel={`${totalReceived} / ${totalRequired} items`} />
        <StatCard label="Completed" value={completedCount} icon="check" accent="success" />
      </div>

      {/* Donation status summary */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatusSummaryCard icon={Clock} label="Pledged" count={pendingCount} iconBg="bg-warning-100" iconColor="text-warning-700" />
        <StatusSummaryCard icon={ClipboardCheck} label="Confirmed" count={confirmedCount} iconBg="bg-ocean-100" iconColor="text-ocean-700" />
        <StatusSummaryCard icon={PackageCheck} label="Collected" count={collectedCount} iconBg="bg-ocean-100" iconColor="text-ocean-700" />
        <StatusSummaryCard icon={Truck} label="Delivered" count={deliveredCount} iconBg="bg-success-100" iconColor="text-success-700" />
        <StatusSummaryCard icon={CheckCircle2} label="Completed" count={completedCount} iconBg="bg-success-100" iconColor="text-success-700" />
      </div>

      {/* Analytics charts */}
      {!loading && needs.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cta-500" />
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Most Requested Items</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Required vs received quantities by item.</p>
            <div className="mt-4 h-64">
              <canvas ref={itemsBarRef} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-ocean-500" />
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Fulfilment by Category</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Items required across each category.</p>
            <div className="mt-4 h-64">
              <canvas ref={categoryDoughnutRef} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-slate-200 dark:border-navy-700">
        {([
          { key: 'overview', label: 'Donations', icon: HandHeart },
          { key: 'needs', label: 'School Needs', icon: Package },
        ] as { key: Tab; label: string; icon: typeof Package }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key ? 'border-cta-500 text-cta-700 dark:text-cta-400' : 'border-transparent text-slate-600 hover:text-navy-800 dark:text-slate-400 dark:hover:text-navy-200'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6" key={lastUpdate}>
        {loading ? (
          <LoadingSpinner label="Loading data..." />
        ) : tab === 'overview' ? (
          <DonationsTable
            donations={donations}
            onStatusChange={handleStatusChange}
            statusUpdating={statusUpdating}
            statusOptions={statusOptions}
            statusIcons={statusIcons}
          />
        ) : (
          <NeedsManager
            needs={needs}
            onEdit={openEdit}
            onDelete={handleDeleteNeed}
          />
        )}
      </div>

      <NeedFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetchNeeds}
        editingNeed={editingNeed}
      />
    </div>
  );
}

function StatusSummaryCard({ icon: Icon, label, count, iconBg, iconColor }: {
  icon: typeof Clock;
  label: string;
  count: number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-700 dark:bg-navy-900">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="font-display text-xl font-bold text-navy-900 dark:text-navy-100">{count}</p>
        </div>
      </div>
    </div>
  );
}

interface DonationsTableProps {
  donations: DonationWithNeed[];
  onStatusChange: (id: string, status: DonationStatus) => void;
  statusUpdating: string | null;
  statusOptions: DonationStatus[];
  statusIcons: Record<DonationStatus, typeof Clock>;
}

function DonationsTable({ donations, onStatusChange, statusUpdating, statusOptions, statusIcons }: DonationsTableProps) {
  if (donations.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-navy-700">
        <ClipboardList className="mx-auto h-12 w-12 text-slate-300 dark:text-navy-600" />
        <p className="mt-4 font-display text-lg font-semibold text-navy-800 dark:text-navy-200">No donations yet</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">Donations will appear here once donors start pledging.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 dark:bg-navy-800">
            <tr className="text-left text-xs uppercase tracking-wider text-navy-700 dark:text-navy-300">
              <th className="px-4 py-3 font-semibold">Donor</th>
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Qty</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-navy-800">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-ocean-50/40 dark:hover:bg-navy-800/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-navy-800 dark:text-navy-200">{d.donor_name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{d.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {d.school_need?.item_name ?? '—'}
                </td>
                <td className="px-4 py-3 font-semibold text-navy-800 dark:text-navy-200">{d.quantity}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(d.donation_date)}</td>
                <td className="px-4 py-3"><DonationStatusBadge status={d.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {statusOptions.map((s) => {
                      const Icon = statusIcons[s];
                      const isActive = d.status === s;
                      const isUpdating = statusUpdating === d.id;
                      return (
                        <button
                          key={s}
                          onClick={() => !isActive && onStatusChange(d.id, s)}
                          disabled={isActive || isUpdating}
                          title={s}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
                            isActive
                              ? `${donationStatusColors[s]} ring-2 ring-offset-1 ring-current`
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-400 dark:hover:bg-navy-700'
                          } ${isUpdating ? 'opacity-50' : ''}`}
                        >
                          <Icon className="h-3 w-3" />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface NeedsManagerProps {
  needs: SchoolNeed[];
  onEdit: (need: SchoolNeed) => void;
  onDelete: (id: string) => void;
}

function NeedsManager({ needs, onEdit, onDelete }: NeedsManagerProps) {
  if (needs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-navy-700">
        <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-navy-600" />
        <p className="mt-4 font-display text-lg font-semibold text-navy-800 dark:text-navy-200">No needs yet</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">Click "Add Need" to create the first one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needs.map((need) => (
        <div key={need.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-white">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-navy-900 dark:text-navy-100">{need.item_name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <PriorityBadge priority={need.priority} />
                    <NeedStatusBadge status={need.status} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{need.category}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <ProgressBar
                pledged={need.quantity_pledged}
                received={need.quantity_received}
                required={need.quantity_required}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(need)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-ocean-50 dark:border-navy-600 dark:text-navy-200 dark:hover:bg-navy-800"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => onDelete(need.id)}
                className="flex items-center gap-1.5 rounded-xl border border-error-300 px-3 py-2 text-sm font-semibold text-error-700 hover:bg-error-50 dark:border-error-700 dark:text-error-400 dark:hover:bg-error-900/30"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
