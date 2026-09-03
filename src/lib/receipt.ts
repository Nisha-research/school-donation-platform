import jsPDF from 'jspdf';
import type { DonationWithNeed } from './types';
import { formatDate } from './format';

export function generateReceipt(donation: DonationWithNeed): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header band
  doc.setFillColor(31, 56, 100);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SchoolCare Connect', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Donation Receipt', margin, 26);
  doc.text(new Date().toLocaleDateString('en-IN'), pageWidth - margin, 26, { align: 'right' });

  // Body
  let y = 50;
  doc.setTextColor(30, 41, 59);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Thank You for Your Donation', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const intro = `Dear ${donation.donor_name}, on behalf of the students and staff, thank you for your generous contribution.`;
  const introLines = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 6 + 6;

  // Divider
  doc.setDrawColor(200, 210, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Details table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Donation Details', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const schoolName = donation.school_need?.school?.name ?? 'Green Valley Government School';
  const itemName = donation.school_need?.item_name ?? 'Item';
  const category = donation.school_need?.category ?? '—';

  const rows: [string, string][] = [
    ['School', schoolName],
    ['Donor Name', donation.donor_name],
    ['Email', donation.email],
    ['Phone', donation.phone],
    ['Item', itemName],
    ['Category', category],
    ['Quantity', String(donation.quantity)],
    ['Date', formatDate(donation.donation_date)],
    ['Status', donation.status],
    ['Receipt ID', donation.id.slice(0, 8).toUpperCase()],
  ];

  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), margin + 50, y);
    y += 6;
  });

  y += 4;
  doc.setDrawColor(200, 210, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Thank you note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const note = 'Your donation helps provide essential school supplies to students who need them most. Every item you contribute makes a real difference in a child\'s education. We are deeply grateful for your support.';
  const noteLines = doc.splitTextToSize(note, contentWidth);
  doc.text(noteLines, margin, y);
  y += noteLines.length * 6 + 6;

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('SchoolCare Connect — Transparent donations for student success.', margin, 280);
  doc.text('For questions, contact admin@schoolcare.org', margin, 285);

  doc.save(`receipt-${donation.id.slice(0, 8)}.pdf`);
}
