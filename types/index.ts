export type AccountType = 'credit' | 'debit' | 'savings'
export type TransactionType = 'debit' | 'credit'
export type TransactionSource = 'credit_card' | 'debit_card' | 'manual'
export type ParseStatus = 'pending' | 'parsed' | 'failed'
export type IncomeSource = 'salary' | 'freelance' | 'other'

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface Account {
  id: string
  name: string
  bank_name: string
  type: AccountType
  current_balance: number
  created_at: string
}

export interface Statement {
  id: string
  account_id: string
  month: number
  year: number
  upload_date: string
  file_url: string
  parse_status: ParseStatus
  accounts?: Account
}

export interface Transaction {
  id: string
  account_id: string
  statement_id: string | null
  date: string
  description: string
  amount: number
  type: TransactionType
  category_id: string | null
  source: TransactionSource
  created_at: string
  categories?: Category
  accounts?: Account
}

export interface Balance {
  id: string
  account_id: string
  amount: number
  recorded_at: string
  accounts?: Account
}

export interface Income {
  id: string
  account_id: string
  amount: number
  source: IncomeSource
  description: string | null
  date: string
  accounts?: Account
}

export interface AiAdvice {
  id: string
  month: number
  year: number
  content: string
  generated_at: string
}

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: TransactionType
  category: string
  is_income: boolean
}
