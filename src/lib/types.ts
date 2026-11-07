// Shapes of the data we read from Supabase.

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  footer_note: string | null;
  bill_counter: number;
  created_at: string;
}

export interface CustomerSummary {
  id: string;
  phone: string;
  name: string | null;
  created_at: string;
  bill_count: number;
  total_spent: number;
  last_purchase: string | null;
}

/** Returned by the get_public_bill(token) database function. */
export interface PublicBill {
  bill_number: string;
  public_token: string;
  created_at: string;
  subtotal: number;
  discount: number;
  discount_type: 'amount' | 'percent' | null;
  discount_value: number | null;
  total: number;
  note: string | null;
  customer: { name: string | null; phone: string };
  business: {
    name: string;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    footer_note: string | null;
  };
  items: { item_name: string; quantity: number; unit_price: number; line_total: number }[];
}

export interface Item {
  id: string;
  name: string;
  price: number;
  updated_at: string;
}

export interface Member {
  id: string;
  email: string;
  user_id: string | null;
  role: 'staff';
  created_at: string;
}

export interface DashboardStats {
  today_sales: number;
  today_bills: number;
  month_sales: number;
  month_bills?: number;
  all_time_sales?: number;
  avg_bill?: number;
  total_bills: number;
  total_customers: number;
  daily_revenue: { date: string; total: number }[];
  monthly_revenue?: { month: string; total: number; bills: number }[];
  weekday: { dow: number; bills: number; total: number }[];
  top_customers: { id: string; name: string | null; phone: string; total: number; bills: number }[];
}
