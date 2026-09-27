import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, HandHeart, ArrowRight, Package, CheckCircle2, TrendingUp, Heart, MapPin } from 'lucide-react';
import { useRealtimeNeeds } from '@/lib/useRealtimeNeeds';
import { fetchSchools } from '@/lib/data';
import type { School } from '@/lib/types';
import { StatCard } from '@/components/StatCard';
import { NeedCard } from '@/components/NeedCard';
import { SchoolMap } from '@/components/SchoolMap';
import { LoadingSpinner } from '@/components/Layout';

export function HomePage() {
  const { needs, loading } = useRealtimeNeeds();
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSchools();
        setSchools(data);
      } catch {
        // ignore
      } finally {
        setSchoolsLoading(false);
      }
    })();
  }, []);

  const totalRequired = needs.reduce((s, n) => s + n.quantity_required, 0);
  const totalReceived = needs.reduce((s, n) => s + n.quantity_received, 0);
  const totalPledged = needs.reduce((s, n) => s + n.quantity_pledged, 0);
  const openNeeds = needs.filter((n) => n.status !== 'Closed').length;
  const fulfilledNeeds = needs.filter((n) => n.status === 'Closed').length;
  const fulfilmentRate = totalRequired > 0 ? Math.round((totalReceived / totalRequired) * 100) : 0;

  const featuredNeeds = needs.filter((n) => n.status !== 'Closed').slice(0, 3);
  const primarySchool = schools[0] ?? null;

  if (loading && schoolsLoading) return <LoadingSpinner label="Loading..." />;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-ocean-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(197,90,17,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(46,117,182,0.2),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-cta-500/15 px-4 py-1.5 text-sm font-medium text-cta-300">
              <Sparkles className="h-4 w-4" />
              {primarySchool?.name ?? 'Janta Vidyalaya'}
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Every child deserves the tools to learn.
            </h1>
            <p className="mt-5 text-lg text-slate-300 sm:text-xl">
              Help us provide essential school supplies — stationery, bags, and books — to students who need them most.
              Pledge a donation today and track it from pledge to delivery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/needs"
                className="flex items-center justify-center gap-2 rounded-xl bg-cta-500 px-7 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-cta-600 hover:shadow-xl"
              >
                <HandHeart className="h-5 w-5" />
                Donate Now
              </Link>
              <Link
                to="/track"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                Track My Donation
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Items Needed" value={totalRequired} icon="package" accent="navy" />
          <StatCard label="Items Received" value={totalReceived} icon="check" accent="success" sublabel={`${fulfilmentRate}% fulfilled`} />
          <StatCard label="Items Pledged" value={totalPledged} icon="heart" accent="cta" />
          <StatCard label="Open Needs" value={openNeeds} icon="trending" accent="ocean" sublabel={`${fulfilledNeeds} fulfilled`} />
        </div>
      </section>

      {/* Featured needs */}
      {featuredNeeds.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy-900 dark:text-navy-100">Urgent Needs</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">These items need your support the most right now.</p>
            </div>
            <Link
              to="/needs"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cta-700 hover:text-cta-800 dark:text-cta-400"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredNeeds.map((need) => (
              <div key={need.id} className="animate-slide-up">
                <NeedCard need={need} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map section */}
      {primarySchool && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-ocean-100 px-3 py-1 text-sm font-semibold text-ocean-800 dark:bg-navy-800 dark:text-ocean-400">
                <MapPin className="h-4 w-4" />
                School Location
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-navy-900 dark:text-navy-100">{primarySchool.name}</h2>
              {primarySchool.address && (
                <p className="mt-2 text-slate-600 dark:text-slate-400">{primarySchool.address}</p>
              )}
              <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
                Your donations are delivered directly to the school. Track the journey from pledge to delivery
                and see the impact you make on students' lives.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-xl bg-ocean-50 px-4 py-3 dark:bg-navy-800">
                  <Package className="h-5 w-5 text-ocean-600 dark:text-ocean-400" />
                  <div>
                    <p className="font-display text-xl font-bold text-navy-900 dark:text-navy-100">{needs.length}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Active Needs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 dark:bg-navy-800">
                  <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-400" />
                  <div>
                    <p className="font-display text-xl font-bold text-navy-900 dark:text-navy-100">{fulfilledNeeds}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Fulfilled</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-cta-50 px-4 py-3 dark:bg-navy-800">
                  <TrendingUp className="h-5 w-5 text-cta-600 dark:text-cta-400" />
                  <div>
                    <p className="font-display text-xl font-bold text-navy-900 dark:text-navy-100">{fulfilmentRate}%</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Fulfilment Rate</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-navy-700">
              <SchoolMap school={primarySchool} height="400px" />
            </div>
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 to-ocean-800 px-8 py-12 text-center text-white sm:px-12 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,90,17,0.15),transparent_60%)]" />
          <div className="relative">
            <Heart className="mx-auto h-10 w-10 text-cta-400" />
            <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Ready to make a difference?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Every item counts. Pledge stationery, bags, or books and follow the journey until it reaches a student's hands.
            </p>
            <Link
              to="/needs"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cta-500 px-7 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-cta-600 hover:shadow-xl"
            >
              <HandHeart className="h-5 w-5" />
              Browse Needs & Donate
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
