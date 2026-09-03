import { useEffect, useRef, useState } from 'react';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  TrendingDown,
  Target,
  Lightbulb,
  CheckSquare,
  Shield,
} from 'lucide-react';
import {
  Chart,
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import type { Chart as ChartJS } from 'chart.js';
import { fetchSurvey, fetchNeeds } from '@/lib/data';
import type { Survey, SchoolNeed } from '@/lib/types';
import { LoadingSpinner, ErrorState } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { formatDate } from '@/lib/format';
import { PriorityBadge } from '@/components/Badges';
import { useAuth } from '@/lib/auth';

Chart.register(
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

export function SurveyPage() {
  const { isAdmin } = useAuth();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [needs, setNeeds] = useState<SchoolNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pieRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<ChartJS | null>(null);
  const barChartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, n] = await Promise.all([fetchSurvey(), fetchNeeds()]);
        setSurvey(s);
        setNeeds(n);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load survey.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!survey || loading) return;

    // Pie chart: demographic breakdown
    if (pieRef.current) {
      pieChartRef.current?.destroy();
      pieChartRef.current = new Chart(pieRef.current, {
        type: 'pie',
        data: {
          labels: survey.responses.map((r) => r.label),
          datasets: [
            {
              data: survey.responses.map((r) => r.value),
              backgroundColor: survey.responses.map((r) => r.color),
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 12 }, padding: 12 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} students`,
              },
            },
          },
        },
      });
    }

    // Bar chart: Required vs Received
    if (barRef.current) {
      barChartRef.current?.destroy();
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      const sorted = [...needs].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      const colorMap = { High: '#b93535', Medium: '#d18d1a', Low: '#2E75B6' };

      barChartRef.current = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map((n) => n.item_name),
          datasets: [
            {
              label: 'Required',
              data: sorted.map((n) => n.quantity_required),
              backgroundColor: sorted.map((n) => colorMap[n.priority]),
              borderRadius: 6,
              barPercentage: 0.6,
            },
            {
              label: 'Received',
              data: sorted.map((n) => n.quantity_received),
              backgroundColor: '#2f8138',
              borderRadius: 6,
              barPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 11 } },
              grid: { color: '#eef2f8' },
            },
            x: {
              ticks: { font: { size: 11 } },
              grid: { display: false },
            },
          },
        },
      });
    }

    return () => {
      pieChartRef.current?.destroy();
      barChartRef.current?.destroy();
    };
  }, [survey, needs, loading]);

  if (loading) return <LoadingSpinner label="Loading survey report..." />;
  if (error) return <ErrorState message={error} />;
  if (!survey) return <ErrorState message="No survey data available yet." />;

  const ewPercent = Math.round((survey.economically_weaker / survey.total_students) * 100);
  const supportedStudents = survey.total_students - survey.economically_weaker;

  const challenges = [
    '68% of students come from economically weaker backgrounds and cannot afford basic stationery.',
    '95 students do not have a proper school bag, carrying books in plastic bags.',
    '74 students are missing core textbooks, making it difficult to follow lessons.',
    'Many students share a single pen or pencil between multiple classmates.',
  ];

  const recommendations = [
    'Prioritize high-volume, low-cost items (pens, notebooks) for maximum reach.',
    'Partner with local businesses for bulk procurement of school bags.',
    'Set up a textbook lending library to reduce per-student cost.',
    'Run quarterly needs assessments to keep the donation list current.',
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-ocean-100 px-3 py-1 text-sm font-semibold text-ocean-800 dark:bg-navy-800 dark:text-ocean-400">
          <Target className="h-4 w-4" />
          Survey Report — {formatDate(survey.submitted_at)}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy-900 dark:text-navy-100">
          {survey.organization_name}
        </h1>
        <p className="mt-2 text-slate-700 dark:text-slate-400">
          A needs assessment of our student population to guide donation priorities.
        </p>
      </div>

      {/* Summary cards - visible to everyone */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={survey.total_students} icon="users" accent="navy" />
        <StatCard
          label="Economically Weaker"
          value={`${ewPercent}%`}
          icon="trending"
          accent="cta"
          sublabel={`${survey.economically_weaker} students`}
        />
        <StatCard label="Currently Supported" value={supportedStudents} icon="check" accent="success" />
        <StatCard label="Active Needs" value={needs.filter((n) => n.status !== 'Closed').length} icon="package" accent="ocean" />
      </div>

      {/* Charts - visible to everyone */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Student Needs Breakdown</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Distribution of identified needs across the student body.</p>
          <div className="mt-4 h-72">
            <canvas ref={pieRef} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Required vs Received by Item</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Bar color indicates priority (red=high, orange=medium, blue=low).</p>
          <div className="mt-4 h-72">
            <canvas ref={barRef} />
          </div>
        </div>
      </div>

      {/* Priority Ranking table - ADMIN ONLY */}
      {isAdmin && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-900">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cta-500" />
            <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-navy-100">Priority Ranking of Needs</h2>
            <span className="rounded-full bg-cta-100 px-2.5 py-0.5 text-xs font-bold text-cta-800 dark:bg-cta-900/40 dark:text-cta-300">Admin Only</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-600 dark:border-navy-700 dark:text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Item</th>
                  <th className="pb-3 pr-4 font-semibold">Category</th>
                  <th className="pb-3 pr-4 font-semibold">Priority</th>
                  <th className="pb-3 pr-4 font-semibold">Required</th>
                  <th className="pb-3 pr-4 font-semibold">Received</th>
                  <th className="pb-3 font-semibold">Gap</th>
                </tr>
              </thead>
              <tbody>
                {[...needs]
                  .sort((a, b) => {
                    const order = { High: 0, Medium: 1, Low: 2 };
                    return order[a.priority] - order[b.priority];
                  })
                  .map((n) => (
                    <tr key={n.id} className="border-b border-slate-100 dark:border-navy-800">
                      <td className="py-3 pr-4 font-semibold text-navy-900 dark:text-navy-200">{n.item_name}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{n.category}</td>
                      <td className="py-3 pr-4"><PriorityBadge priority={n.priority} /></td>
                      <td className="py-3 pr-4 font-medium text-navy-800 dark:text-slate-300">{n.quantity_required}</td>
                      <td className="py-3 pr-4 font-medium text-success-700 dark:text-success-400">{n.quantity_received}</td>
                      <td className="py-3 font-bold text-cta-700 dark:text-cta-400">
                        {Math.max(0, n.quantity_required - n.quantity_received)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Challenges & Recommendations - visible to everyone */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-error-200 bg-error-50/40 p-6 dark:border-error-800 dark:bg-error-900/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-error-600 dark:text-error-400" />
            <h2 className="font-display text-lg font-semibold text-error-800 dark:text-error-400">Key Challenges</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {challenges.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-navy-800 dark:text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-error-400" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-success-200 bg-success-50/40 p-6 dark:border-success-800 dark:bg-success-900/20">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-success-600 dark:text-success-400" />
            <h2 className="font-display text-lg font-semibold text-success-800 dark:text-success-400">Recommendations</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-navy-800 dark:text-slate-300">
                <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stats summary banner */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl bg-navy-800 p-5 text-white">
          <GraduationCap className="h-8 w-8 text-cta-400" />
          <div>
            <p className="font-display text-2xl font-bold">{survey.total_students}</p>
            <p className="text-sm text-navy-200">Students enrolled</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-cta-500 p-5 text-white">
          <TrendingDown className="h-8 w-8 text-white" />
          <div>
            <p className="font-display text-2xl font-bold">{ewPercent}%</p>
            <p className="text-sm text-cta-100">Need support</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-success-500 p-5 text-white">
          <Users className="h-8 w-8 text-white" />
          <div>
            <p className="font-display text-2xl font-bold">{supportedStudents}</p>
            <p className="text-sm text-success-100">Currently supported</p>
          </div>
        </div>
      </div>
    </div>
  );
}
