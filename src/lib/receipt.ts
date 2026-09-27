import { jsPDF } from 'jspdf';
import type { DonationWithNeed } from '@/lib/types';

export function generateReceipt(donation: DonationWithNeed): void {
  const document = new jsPDF();
  const schoolName = donation.school_need?.school?.name ?? 'Janta Vidyalaya';
  const itemName = donation.school_need?.item_name ?? 'Donation item';
  const date = new Date(donation.donation_date).toLocaleDateString();

  document.setFillColor(31, 56, 100);
  document.rect(0, 0, 210, 34, 'F');
  document.setTextColor(255, 255, 255);
  document.setFontSize(22);
  document.setFont('helvetica', 'bold');
  document.text('SchoolCare Connect', 20, 20);
  document.setFontSize(10);
  document.setFont('helvetica', 'normal');
  document.text('Donation receipt', 20, 27);

  document.setTextColor(31, 56, 100);
  document.setFontSize(16);
  document.setFont('helvetica', 'bold');
  document.text('Thank you for your donation', 20, 55);

  document.setTextColor(60, 60, 60);
  document.setFontSize(11);
  document.setFont('helvetica', 'normal');
  const details = [
    ['Receipt ID', donation.id],
    ['Donor', donation.donor_name],
    ['Email', donation.email],
    ['School', schoolName],
    ['Item', itemName],
    ['Quantity', String(donation.quantity)],
    ['Status', donation.status],
    ['Donation date', date],
  ];

  let y = 72;
  for (const [label, value] of details) {
    document.setFont('helvetica', 'bold');
    document.text(`${label}:`, 20, y);
    document.setFont('helvetica', 'normal');
    document.text(value, 65, y);
    y += 10;
  }

  document.setDrawColor(220, 226, 235);
  document.line(20, y + 4, 190, y + 4);
  document.setFontSize(10);
  document.setTextColor(90, 90, 90);
  document.text('Your support helps provide essential learning supplies to students.', 20, y + 18);
  document.save(`schoolcare-receipt-${donation.id.slice(0, 8)}.pdf`);
}
