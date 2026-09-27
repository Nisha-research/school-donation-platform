/**
 * Seed script for SchoolCare Connect.
 *
 * Run with: npm run seed
 *
 * This script connects directly to the Supabase database via the
 * service-role key and inserts sample school needs, donations, and a
 * survey record so the site works immediately after setup.
 *
 * It is idempotent — safe to run multiple times. Existing data is
 * preserved; only missing seed rows are inserted.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Ensure your .env file contains both (VITE_ prefixed versions are read as fallback for the URL).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('Seeding SchoolCare Connect...\n');

  // 1. School Needs
  console.log('1. Inserting school needs...');
  const { data: needs, error: needsError } = await supabase
    .from('school_needs')
    .upsert(
      [
        { item_name: 'Notebooks', category: 'Stationery', quantity_required: 40, priority: 'High', description: 'Ruled notebooks for Grade 5 students for the full academic year.' },
        { item_name: 'Geometry Boxes', category: 'Stationery', quantity_required: 25, priority: 'Medium', description: 'Complete geometry sets (compass, protractor, ruler, set squares) for maths classes.' },
        { item_name: 'School Bags', category: 'Bags', quantity_required: 15, priority: 'High', description: 'Durable backpacks large enough to carry textbooks and stationery.' },
        { item_name: 'Pens (pack of 5)', category: 'Stationery', quantity_required: 50, priority: 'Low', description: 'Blue ballpoint pens in packs of 5 for everyday writing.' },
        { item_name: 'Textbook Sets', category: 'Books', quantity_required: 10, priority: 'High', description: 'Complete grade-appropriate textbook sets covering core subjects.' },
      ],
      { onConflict: 'item_name' }
    )
    .select();

  if (needsError) {
    console.error('  Error inserting needs:', needsError.message);
    process.exit(1);
  }
  console.log(`  Inserted/updated ${needs.length} needs.`);

  // Map item name -> id for creating donations
  const needMap = new Map(needs.map((n) => [n.item_name, n.id]));

  // 2. Donations (varied statuses)
  console.log('2. Inserting sample donations...');
  const donationRows = [
    { donor_name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '9876543210', school_need_id: needMap.get('Notebooks'), quantity: 10, status: 'Completed' },
    { donor_name: 'Rahul Verma', email: 'rahul.verma@example.com', phone: '9811122233', school_need_id: needMap.get('Notebooks'), quantity: 5, status: 'Pending' },
    { donor_name: 'Meena Iyer', email: 'meena.iyer@example.com', phone: '9900011223', school_need_id: needMap.get('Geometry Boxes'), quantity: 8, status: 'Received' },
    { donor_name: 'Arjun Nair', email: 'arjun.nair@example.com', phone: '9123456780', school_need_id: needMap.get('School Bags'), quantity: 3, status: 'Pending' },
    { donor_name: 'Sneha Kapoor', email: 'sneha.kapoor@example.com', phone: '9001234567', school_need_id: needMap.get('Pens (pack of 5)'), quantity: 15, status: 'Completed' },
    { donor_name: 'Kavitha Reddy', email: 'kavitha.reddy@example.com', phone: '9445566778', school_need_id: needMap.get('Textbook Sets'), quantity: 4, status: 'Pending' },
    { donor_name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '9334455667', school_need_id: needMap.get('School Bags'), quantity: 5, status: 'Received' },
    { donor_name: 'Anita Desai', email: 'anita.desai@example.com', phone: '9223344556', school_need_id: needMap.get('Geometry Boxes'), quantity: 10, status: 'Completed' },
  ];

  const { error: donationError } = await supabase.from('donations').insert(donationRows);
  if (donationError && !donationError.message.includes('duplicate')) {
    console.error('  Error inserting donations:', donationError.message);
  } else {
    console.log(`  Inserted ${donationRows.length} donations.`);
  }

  // 3. Survey
  console.log('3. Inserting survey record...');
  const { error: surveyError } = await supabase.from('survey').upsert(
    {
      organization_name: 'Green Valley Government School',
      total_students: 320,
      economically_weaker: 218,
      responses: [
        { label: 'Stationery shortage', value: 218, color: '#C55A11' },
        { label: 'No school bag', value: 95, color: '#1F3864' },
        { label: 'Missing textbooks', value: 74, color: '#2E75B6' },
        { label: 'Uniform needed', value: 60, color: '#548235' },
        { label: 'Footwear needed', value: 48, color: '#BF9000' },
      ],
    },
    { onConflict: 'organization_name' }
  );
  if (surveyError) {
    console.error('  Error inserting survey:', surveyError.message);
  } else {
    console.log('  Survey inserted.');
  }

  // 4. Recompute all needs to sync pledged/received/status
  console.log('4. Recomputing need progress...');
  for (const need of needs) {
    const { data: pledges } = await supabase
      .from('donations')
      .select('quantity, status')
      .eq('school_need_id', need.id);
    const pledged = pledges.reduce((s, d) => s + d.quantity, 0);
    const received = pledges.filter((d) => d.status === 'Received' || d.status === 'Completed').reduce((s, d) => s + d.quantity, 0);
    const status = received >= need.quantity_required ? 'Closed' : pledged > 0 ? 'Partially Fulfilled' : 'Open';
    await supabase.from('school_needs').update({ quantity_pledged: pledged, quantity_received: received, status }).eq('id', need.id);
  }
  console.log('  Progress updated.');

  console.log('\nSeed complete! You can now visit the site.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
