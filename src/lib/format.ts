import type { DonationStatus, NeedStatus, Priority } from './types';

export function pledgePercent(pledged: number, required: number): number {
  if (required <= 0) return 0;
  return Math.min(100, Math.round((pledged / required) * 100));
}

export function receivedPercent(received: number, required: number): number {
  if (required <= 0) return 0;
  return Math.min(100, Math.round((received / required) * 100));
}

export function remainingPledge(pledged: number, required: number): number {
  return Math.max(0, required - pledged);
}

export function remainingReceive(received: number, required: number): number {
  return Math.max(0, required - received);
}

export const priorityColors: Record<Priority, string> = {
  High: 'bg-error-500 text-white',
  Medium: 'bg-warning-500 text-white',
  Low: 'bg-ocean-500 text-white',
};

export const priorityBorder: Record<Priority, string> = {
  High: 'border-error-300',
  Medium: 'border-warning-300',
  Low: 'border-ocean-300',
};

export const needStatusColors: Record<NeedStatus, string> = {
  Open: 'bg-ocean-100 text-ocean-800 dark:bg-ocean-900/40 dark:text-ocean-300',
  'Partially Fulfilled': 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300',
  Closed: 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300',
};

export const donationStatusColors: Record<DonationStatus, string> = {
  Pledged: 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300',
  Confirmed: 'bg-ocean-100 text-ocean-800 dark:bg-ocean-900/40 dark:text-ocean-300',
  Collected: 'bg-ocean-100 text-ocean-800 dark:bg-ocean-900/40 dark:text-ocean-300',
  Delivered: 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300',
  Completed: 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300',
};

export const donationStatusStep: Record<DonationStatus, number> = {
  Pledged: 0,
  Confirmed: 1,
  Collected: 2,
  Delivered: 3,
  Completed: 4,
};

export const donationStatusOrder: DonationStatus[] = [
  'Pledged',
  'Confirmed',
  'Collected',
  'Delivered',
  'Completed',
];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
