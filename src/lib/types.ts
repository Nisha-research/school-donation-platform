export type Category = 'Stationery' | 'Bags' | 'Books' | 'Other';
export type Priority = 'High' | 'Medium' | 'Low';
export type NeedStatus = 'Open' | 'Partially Fulfilled' | 'Closed';
export type DonationStatus = 'Pledged' | 'Confirmed' | 'Collected' | 'Delivered' | 'Completed';

export interface School {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface SchoolNeed {
  id: string;
  item_name: string;
  category: Category;
  quantity_required: number;
  quantity_pledged: number;
  quantity_received: number;
  priority: Priority;
  status: NeedStatus;
  description: string | null;
  school_id: string | null;
  school?: School | null;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_name: string;
  email: string;
  phone: string;
  school_need_id: string;
  quantity: number;
  status: DonationStatus;
  donation_date: string;
  created_at: string;
  user_id: string | null;
}

export interface DonationWithNeed extends Donation {
  school_need?: Pick<SchoolNeed, 'id' | 'item_name' | 'category' | 'quantity_required' | 'school_id' | 'school'> & {
    school?: School | null;
  };
}

export interface DonationHistoryEntry {
  id: string;
  donation_id: string;
  from_status: DonationStatus | null;
  to_status: DonationStatus;
  note: string | null;
  changed_at: string;
}

export interface SurveyResponse {
  label: string;
  value: number;
  color: string;
}

export interface Survey {
  id: string;
  organization_name: string;
  total_students: number;
  economically_weaker: number;
  responses: SurveyResponse[];
  submitted_at: string;
}

export interface DonationInput {
  donor_name: string;
  email: string;
  phone: string;
  school_need_id: string;
  quantity: number;
  user_id?: string;
}
