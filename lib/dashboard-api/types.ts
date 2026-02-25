export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  account_type: 'Savings' | 'Current' | 'Fixed Deposit';
  balance: number;
  status: 'active' | 'dormant' | 'frozen';
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  duration_months: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  category: 'Bills' | 'School Fees' | 'Utilities' | 'e-Pins' | 'Transfer';
  status: 'successful' | 'pending' | 'failed';
  reference: string;
  created_at: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  category: 'Global Content' | 'Product Settings';
  updated_at: string;
}
