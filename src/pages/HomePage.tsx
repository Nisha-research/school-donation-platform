import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  ArrowRight,
  Package,
  CheckCircle2,
  Users,
  TrendingUp,
  Target,
  BookOpen,
  Backpack,
  PenTool,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { fetchDonations, fetchSurvey, fetchSchools } from '@/lib/data';
import { useRealtimeNeeds } from '@/lib/useRealtimeNeeds';
import type { Donation, Survey, School } from '@/lib/types';
import { LoadingSpinner } from '@/components/Layout';
import { ProgressBar } from '@/components/ProgressBar';
import { StatCard } from '@/components/StatCard';
import { SchoolMap } from '@/components/SchoolMap';

export function HomePage() {
  const { needs, loading: needsLoading } = useRealtimeNeeds();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [extraLoading, setExtraLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, s, schools] = await Promise.all([fetchDonations(), fetchSurvey(), fetchSchools()]);
        setDonations(d);
        setSurvey(s);
        setSchool(schools[0] ?? null);
      } catch {
        // fall through to empty state
      } finally {
        setExtraLoading(false);
      }
    })();
  }, []);

  const loading = needsLoading || extraLoading;
  if (loading) return <LoadingSpinner label="Loading school data..." />;

  const totalRequired = needs.reduce((s, n) => s + n.quantity_required, 0);
  const totalReceived = needs.reduce((s, n) => s + n.quantity_received, 0);
  const overallPct = totalRequired > 0 ? Math.round((totalReceived / totalRequired) * 100) : 0;
  const openNeeds = needs.filter((n) => n.status !== 'Closed').length;
  const completedDonations = donations.filter((d) => d.status === 'Completed').length;
  const ewPercent = survey
    ? Math.round((survey.economically_weaker / survey.total_students) * 100)
    : 68;
  const featuredNeeds = needs.filter((n) => n.status !== 'Closed').slice(0, 3);

  const categoryIcons: Record<string, typeof BookOpen> = {
    Stationery: PenTool,
    Books: BookOpen,
    Bags: Backpack,
    Other: Package,
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero-pattern relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 text-navy-900 dark:from-navy-800 dark:via-navy-700 dark:to-ocean-800 dark:text-white">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-16 sm:px-6 lg:px-8 lg:pt-6 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-cta-500/15 px-4 py-1.5 text-sm font-medium text-cta-700 dark:bg-cta-500/20 dark:text-cta-300">
                <Sparkles className="h-4 w-4" />
                Green Valley Government School
              </div>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-navy-900 dark:text-white sm:text-5xl">
                Every child deserves the tools to learn.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-700 dark:text-white/90">
                {ewPercent}% of our students need stationery support. Your donation
                directly fulfills specific classroom needs — see the impact in real time.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/needs"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-cta-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-cta-600 hover:shadow-xl"
                >
                  View School Needs
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/survey"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy-300 px-6 py-3.5 text-base font-semibold text-navy-800 transition-all hover:bg-navy-50 dark:border-navy-400 dark:text-white dark:hover:bg-navy-700"
                >
                  See Survey Report
                </Link>
              </div>
            </div>

            {/* Hero progress card */}
            <div className="animate-scale-in rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-white/10 dark:ring-white/20 dark:shadow-none">
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white">Overall Donation Progress</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/80">Items received across all school needs</p>
              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <span className="font-display text-5xl font-extrabold text-navy-900 dark:text-white">{overallPct}%</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-white/80">
                    {totalReceived} / {totalRequired} items
                  </span>
                </div>
                <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-900/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cta-400 to-cta-500 transition-all duration-1000"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-navy-900/40">
                  <p className="font-display text-2xl font-bold text-navy-900 dark:text-white">{openNeeds}</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-white/80">Open Needs</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-navy-900/40">
                  <p className="font-display text-2xl font-bold text-navy-900 dark:text-white">{donations.length}</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-white/80">Donations</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-navy-900/40">
                  <p className="font-display text-2xl font-bold text-navy-900 dark:text-white">{completedDonations}</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-white/80">Completed</p>
                </div>
              </div>

              {school && (
                <div className="mt-5 animate-scale-in rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/20">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cta-500 dark:text-cta-400" />
                    <h3 className="font-display text-base font-semibold text-navy-900 dark:text-white">School Location</h3>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-white/80">{school.name}</p>
                  <div className="relative mt-3 overflow-hidden rounded-xl">
                    <SchoolMap school={school} height="180px" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-600 dark:text-white/80">Items are delivered directly to the school.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Summary stats */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Needs" value={openNeeds} icon="package" accent="navy" />
          <StatCard label="Total Donations" value={donations.length} icon="heart" accent="cta" />
          <StatCard label="Items Received" value={totalReceived} icon="check" accent="success" sublabel={`of ${totalRequired} required`} />
          <StatCard label="Fulfilment Rate" value={`${overallPct}%`} icon="trending" accent="ocean" />
        </div>
      </section>

      {/* Mission / About */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold text-navy-900 dark:text-navy-100">Our Mission</h2>
            <p className="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">
              Green Valley Government School serves 320 students from economically weaker
              backgrounds. Many lack basic stationery, bags, and textbooks — essentials that
              directly affect their ability to learn.
            </p>
            <p className="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">
              SchoolCare Connect makes the donation process fully transparent. You pledge
              exactly what's needed, track it from <span className="font-semibold text-slate-900 dark:text-slate-200">Pending</span> to{' '}
              <span className="font-semibold text-cta-700 dark:text-cta-400">Received</span> to{' '}
              <span className="font-semibold text-success-700 dark:text-success-400">Completed</span>, and see the
              progress bars fill up in real time.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: Target, text: 'Browse specific, verified classroom needs' },
                { icon: HeartHandshake, text: 'Pledge the exact item and quantity you can give' },
                { icon: CheckCircle2, text: 'Track every donation through to completion' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-100 text-ocean-700 dark:bg-navy-800 dark:text-ocean-400">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-navy-800 dark:text-navy-200">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
            <h3 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">How It Works</h3>
            <div className="mt-5 space-y-4">
              {[
                { step: 1, title: 'Browse Needs', desc: 'See exactly what the school needs, with live progress bars.', color: 'bg-ocean-500' },
                { step: 2, title: 'Pledge a Donation', desc: 'Choose an item and quantity. No login required.', color: 'bg-cta-500' },
                { step: 3, title: 'Items Received', desc: 'Admin marks your donation as Received when items arrive.', color: 'bg-warning-500' },
                { step: 4, title: 'Completed', desc: 'Items are distributed. Progress bar turns fully green.', color: 'bg-success-500' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${s.color} font-display text-sm font-bold text-white`}>
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy-900 dark:text-navy-100">{s.title}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured needs */}
      {featuredNeeds.length > 0 && (
        <section className="bg-white dark:bg-navy-900 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold text-navy-900 dark:text-navy-100">Urgent Needs</h2>
                <p className="mt-2 text-slate-700 dark:text-slate-400">These items need your support the most.</p>
              </div>
              <Link
                to="/needs"
                className="hidden items-center gap-1.5 text-sm font-semibold text-cta-700 hover:text-cta-800 sm:flex"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {featuredNeeds.map((need) => {
                const Icon = categoryIcons[need.category] ?? Package;
                return (
                  <div key={need.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm transition-shadow hover:shadow-md dark:border-navy-700 dark:bg-navy-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-navy-900 dark:text-navy-100">{need.item_name}</h3>
                        <p className="text-xs text-slate-700 dark:text-slate-400">{need.category}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        pledged={need.quantity_pledged}
                        received={need.quantity_received}
                        required={need.quantity_required}
                      />
                    </div>
                    <Link
                      to={`/donate/${need.id}`}
                      className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-cta-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cta-600"
                    >
                      <HeartHandshake className="h-4 w-4" />
                      Donate This
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

            {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-100 px-8 py-12 text-center text-navy-900 dark:bg-gradient-to-br dark:from-navy-800 dark:via-navy-700 dark:to-ocean-800 dark:text-white sm:px-12 sm:py-16">
          <Users className="mx-auto h-12 w-12 text-cta-500 dark:text-cta-400" />
          <h2 className="mt-4 font-display text-3xl font-bold text-navy-900 dark:text-white">Ready to make a difference?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-700 dark:text-white/90">
            Every notebook, every pen, every bag helps a child stay in school and learn with dignity.
          </p>
          <Link
            to="/needs"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cta-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-cta-600 hover:shadow-xl"
          >
            Browse All Needs
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}