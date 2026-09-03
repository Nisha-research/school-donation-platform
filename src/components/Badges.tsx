import { Clock, PackageCheck, CheckCircle2, CircleDot, AlertCircle, BadgeCheck, Truck, ClipboardCheck } from 'lucide-react';
import type { DonationStatus, NeedStatus, Priority } from '@/lib/types';
import { donationStatusColors, needStatusColors, priorityColors } from '@/lib/format';

const donationStatusIcons: Record<DonationStatus, typeof Clock> = {
  Pledged: Clock,
  Confirmed: ClipboardCheck,
  Collected: PackageCheck,
  Delivered: Truck,
  Completed: CheckCircle2,
};

const needStatusIcons: Record<NeedStatus, typeof CircleDot> = {
  Open: CircleDot,
  'Partially Fulfilled': AlertCircle,
  Closed: BadgeCheck,
};

const priorityIcons: Record<Priority, typeof AlertCircle> = {
  High: AlertCircle,
  Medium: AlertCircle,
  Low: AlertCircle,
};

export function DonationStatusBadge({ status }: { status: DonationStatus }) {
  const Icon = donationStatusIcons[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold shadow-sm ${donationStatusColors[status]}`}
    >
      <Icon className="h-4 w-4" />
      {status}
    </span>
  );
}

export function NeedStatusBadge({ status }: { status: NeedStatus }) {
  const Icon = needStatusIcons[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold shadow-sm ${needStatusColors[status]}`}
    >
      <Icon className="h-4 w-4" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = priorityIcons[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold shadow-sm ${priorityColors[priority]}`}
    >
      <Icon className="h-4 w-4" />
      {priority} Priority
    </span>
  );
}
