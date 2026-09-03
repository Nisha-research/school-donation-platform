import { supabase } from './supabase';
import type {
  SchoolNeed,
  Donation,
  DonationWithNeed,
  DonationHistoryEntry,
  DonationInput,
  Survey,
  DonationStatus,
  Priority,
  Category,
  School,
} from './types';

// ---- Schools ----

export async function fetchSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSchoolById(id: string): Promise<School | null> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---- School Needs ----

export async function fetchNeeds(): Promise<SchoolNeed[]> {
  const { data, error } = await supabase
    .from('school_needs')
    .select('*, school:schools(*)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNeedById(id: string): Promise<SchoolNeed | null> {
  const { data, error } = await supabase
    .from('school_needs')
    .select('*, school:schools(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createNeed(input: {
  item_name: string;
  category: Category;
  quantity_required: number;
  priority: Priority;
  description?: string;
  school_id?: string;
}): Promise<SchoolNeed> {
  const { data, error } = await supabase
    .from('school_needs')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNeed(
  id: string,
  input: Partial<Pick<SchoolNeed, 'item_name' | 'category' | 'quantity_required' | 'priority' | 'description' | 'status' | 'school_id'>>
): Promise<SchoolNeed> {
  const { data, error } = await supabase
    .from('school_needs')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNeed(id: string): Promise<void> {
  const { error } = await supabase.from('school_needs').delete().eq('id', id);
  if (error) throw error;
}

// ---- Donations ----

export async function fetchDonations(): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('donation_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDonationsWithNeeds(): Promise<DonationWithNeed[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*, school_need:school_needs(id, item_name, category, quantity_required, school_id, school:schools(*))')
    .order('donation_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DonationWithNeed[];
}

export async function fetchDonationsByEmail(email: string): Promise<DonationWithNeed[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*, school_need:school_needs(id, item_name, category, quantity_required, school_id, school:schools(*))')
    .ilike('email', email.trim())
    .order('donation_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DonationWithNeed[];
}

export async function fetchDonationsByUser(userId: string): Promise<DonationWithNeed[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*, school_need:school_needs(id, item_name, category, quantity_required, school_id, school:schools(*))')
    .eq('user_id', userId)
    .order('donation_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DonationWithNeed[];
}

export async function fetchDonationById(id: string): Promise<DonationWithNeed | null> {
  const { data, error } = await supabase
    .from('donations')
    .select('*, school_need:school_needs(id, item_name, category, quantity_required, school_id, school:schools(*))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as DonationWithNeed | null;
}

export async function createDonation(input: DonationInput): Promise<Donation> {
  const { data, error } = await supabase
    .from('donations')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDonationStatus(
  id: string,
  status: DonationStatus
): Promise<void> {
  const { data: before } = await supabase
    .from('donations')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  const oldStatus = (before as { status: DonationStatus } | null)?.status ?? null;

  const { error } = await supabase
    .from('donations')
    .update({ status })
    .eq('id', id);
  if (error) throw error;

  if (oldStatus !== status) {
    await supabase.from('donation_history').insert({
      donation_id: id,
      from_status: oldStatus,
      to_status: status,
      note: `Status updated from ${oldStatus ?? 'Pledged'} to ${status} by admin.`,
    });
  }
}

export async function fetchDonationHistory(donationId: string): Promise<DonationHistoryEntry[]> {
  const { data, error } = await supabase
    .from('donation_history')
    .select('*')
    .eq('donation_id', donationId)
    .order('changed_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- Survey ----

export async function fetchSurvey(): Promise<Survey | null> {
  const { data, error } = await supabase
    .from('survey')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSurvey(
  id: string,
  input: Partial<Pick<Survey, 'organization_name' | 'total_students' | 'economically_weaker' | 'responses'>>
): Promise<Survey> {
  const { data, error } = await supabase
    .from('survey')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
