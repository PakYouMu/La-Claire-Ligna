// ==========================================
// ENUMS
// ==========================================
export type AppRole = 'superuser' | 'admin';
export type TransactionCategory = 'CAPITAL_DEPOSIT' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT';
export type LoanStatus = 'ACTIVE' | 'PAID' | 'VOIDED';

// ==========================================
// VIEW INTERFACES (For fetching/displaying data)
// ==========================================

/** 
 * The main Loan object you will use in the App Dashboard.
 * Corresponds to: view_loan_summary 
 */
export interface LoanSummary {
  id: string;
  borrower_id: string;
  first_name: string;
  last_name: string;
  principal: number;         // Raw principal
  interest_rate: number;     // Raw rate
  duration_months: number;   // Raw duration
  start_date: string;

  // Calculated Fields (from View)
  total_interest: number;
  total_due: number;
  amortization_per_payday: number;
  total_paid: number;
  remaining_balance: number;
  status: LoanStatus;
  is_void: boolean;
  void_reason: string | null;
}

/** 
 * Corresponds to: view_wallet_balance 
 */
export interface WalletSummary {
  cash_on_hand: number;
}

export interface BorrowerStat {
  id: string;
  fund_id: string;
  first_name: string;
  last_name: string;
  active_loan_count: number;
  total_debt: number;
  created_at: string;
}

// ==========================================
// TABLE INTERFACES (For inserts/updates)
// ==========================================

export interface Borrower {
  id: string;
  fund_id: string;
  first_name: string;
  last_name: string;
  signature_url?: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  amount: number;
  category: TransactionCategory;
  notes?: string;
  created_at: string;
  transaction_date?: string;
  loan_id?: string;
  payment_id?: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_by: string;
  changed_at: string;
}

// ==========================================
// PAYLOADS (Type safe inserts)
// ==========================================

export interface CreateBorrowerPayload {
  first_name: string;
  last_name: string;
  signature_url?: string;
}

export interface CreateLoanPayload {
  borrower_id: string;
  principal: number;
  interest_rate: number;
  duration_months: number;
  start_date?: Date;
}

export interface CreatePaymentPayload {
  loan_id: string;
  amount: number;
}

export interface AddCapitalPayload {
  amount: number;
  notes?: string;
}