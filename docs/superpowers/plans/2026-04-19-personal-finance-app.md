# Personal Finance App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal finance web app that parses bank PDF statements, categorizes transactions with Gemini AI, and displays a dashboard with spending breakdowns, net worth tracking, and AI savings advice.

**Architecture:** Next.js App Router frontend + API routes deployed on Vercel. Supabase handles Postgres DB, Auth, and file Storage. Gemini API categorizes transactions and generates advice. pdf-parse extracts raw text from uploaded PDFs.

**Tech Stack:** Next.js 14, TypeScript, Supabase (supabase-js + ssr), Gemini API (@google/generative-ai), pdf-parse, Recharts, Tailwind CSS, Jest + Testing Library

---

## File Structure

```
financing/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx              # Auth guard
│   │   ├── page.tsx                # Dashboard
│   │   ├── transactions/page.tsx
│   │   ├── statements/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── income/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── accounts/route.ts
│   │   ├── balances/route.ts
│   │   ├── categories/route.ts
│   │   ├── income/route.ts
│   │   ├── statements/upload/route.ts
│   │   ├── statements/parse/route.ts
│   │   ├── statements/confirm/route.ts
│   │   ├── transactions/route.ts
│   │   └── advice/route.ts
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── CategoryDonutChart.tsx
│   │   ├── MonthlyTrendChart.tsx
│   │   ├── NetWorthChart.tsx
│   │   ├── AiAdvicePanel.tsx
│   │   └── ManualEntryModal.tsx
│   ├── statements/
│   │   ├── UploadForm.tsx
│   │   └── ReviewTable.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Modal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── gemini.ts
│   ├── pdf-parser.ts
│   └── db/
│       ├── accounts.ts
│       ├── transactions.ts
│       ├── statements.ts
│       ├── balances.ts
│       ├── income.ts
│       ├── categories.ts
│       └── advice.ts
├── types/index.ts
├── middleware.ts
├── supabase/migrations/001_initial_schema.sql
├── .env.local.example
├── jest.config.ts
├── jest.setup.ts
└── package.json
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `jest.config.ts`, `jest.setup.ts`, `.env.local.example`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd E:/programming/financing
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @google/generative-ai pdf-parse recharts
npm install -D @types/pdf-parse jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
}
export default config
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text not null default '#6366f1',
  icon text not null default '💳'
);

insert into categories (name, color, icon) values
  ('Food', '#f97316', '🍔'),
  ('Transport', '#3b82f6', '🚗'),
  ('Shopping', '#ec4899', '🛍️'),
  ('Utilities', '#8b5cf6', '⚡'),
  ('Entertainment', '#f59e0b', '🎬'),
  ('Healthcare', '#10b981', '🏥'),
  ('Salary', '#22c55e', '💰'),
  ('Transfer', '#6b7280', '↔️'),
  ('Other', '#9ca3af', '📦');

-- Accounts
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  bank_name text not null,
  type text not null check (type in ('credit', 'debit', 'savings')),
  current_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Statements
create table statements (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references accounts(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null,
  upload_date timestamptz not null default now(),
  file_url text not null,
  parse_status text not null default 'pending' check (parse_status in ('pending', 'parsed', 'failed'))
);

-- Transactions
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references accounts(id) on delete cascade,
  statement_id uuid references statements(id) on delete set null,
  date date not null,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('debit', 'credit')),
  category_id uuid references categories(id) on delete set null,
  source text not null check (source in ('credit_card', 'debit_card', 'manual')),
  created_at timestamptz not null default now()
);

-- Balances
create table balances (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references accounts(id) on delete cascade,
  amount numeric not null,
  recorded_at date not null default current_date
);

-- Income
create table income (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references accounts(id) on delete cascade,
  amount numeric not null,
  source text not null check (source in ('salary', 'freelance', 'other')),
  description text,
  date date not null
);

-- AI Advice
create table ai_advice (
  id uuid primary key default uuid_generate_v4(),
  month integer not null check (month between 1 and 12),
  year integer not null,
  content text not null,
  generated_at timestamptz not null default now(),
  unique (month, year)
);
```

- [ ] **Step 2: Apply migration via Supabase Dashboard**

Go to your Supabase project → SQL Editor → paste the SQL above → Run.

- [ ] **Step 3: Create storage bucket**

In Supabase Dashboard → Storage → New bucket → name: `statements` → Public: false.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database migration SQL"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Write types**

Create `types/index.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add types/
git commit -m "feat: add TypeScript entity types"
```

---

## Task 4: Supabase Client Library

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `middleware.ts`

- [ ] **Step 1: Browser client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Server client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Admin client (for API routes that need service role)**

Create `lib/supabase/admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 4: Middleware for route protection**

Create `middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: add Supabase client library and route protection middleware"
```

---

## Task 5: Auth — Login Page

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/layout.tsx`, `app/(protected)/layout.tsx`

- [ ] **Step 1: Root layout**

Create `app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = { title: 'Finance Tracker' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Protected layout with nav**

Create `app/(protected)/layout.tsx`:
```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/statements', label: 'Statements' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/income', label: 'Income' },
  { href: '/settings', label: 'Settings' },
]

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex flex-col p-4">
        <h1 className="text-xl font-bold mb-8">Finance</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded text-sm ${pathname === href ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white text-left px-3 py-2">
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Login page**

Create `app/(auth)/login/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Finance Tracker</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create your Supabase user**

In Supabase Dashboard → Authentication → Users → Add user → enter your email + password.

- [ ] **Step 5: Copy `.env.local.example` to `.env.local` and fill in values**

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL, anon key, service role key, Gemini API key
```

- [ ] **Step 6: Start dev server and verify login works**

```bash
npm run dev
# Open http://localhost:3000 — should redirect to /login
# Sign in with your Supabase user credentials
# Should redirect to / after login
```

- [ ] **Step 7: Commit**

```bash
git add app/
git commit -m "feat: add login page and protected layout with nav"
```

---

## Task 6: DB Query Functions

**Files:**
- Create: `lib/db/accounts.ts`, `lib/db/categories.ts`, `lib/db/transactions.ts`, `lib/db/statements.ts`, `lib/db/balances.ts`, `lib/db/income.ts`, `lib/db/advice.ts`

- [ ] **Step 1: Write test for accounts queries**

Create `__tests__/lib/db/accounts.test.ts`:
```typescript
import { getAccounts, createAccount, updateAccountBalance } from '@/lib/db/accounts'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

import { createClient } from '@/lib/supabase/server'

const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
})

test('getAccounts returns data from accounts table', async () => {
  const mockData = [{ id: '1', name: 'Test', bank_name: 'ADCB', type: 'debit', current_balance: 1000, created_at: '' }]
  mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: mockData, error: null }) }) })
  const result = await getAccounts()
  expect(result).toEqual(mockData)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/db/accounts.test.ts --no-coverage
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement accounts queries**

Create `lib/db/accounts.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Account, AccountType } from '@/types'

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('accounts').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function createAccount(input: { name: string; bank_name: string; type: AccountType }): Promise<Account> {
  const supabase = createClient()
  const { data, error } = await supabase.from('accounts').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateAccountBalance(id: string, current_balance: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').update({ current_balance }).eq('id', id)
  if (error) throw error
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/db/accounts.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Implement remaining DB query files**

Create `lib/db/categories.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}

export async function updateCategory(id: string, input: Partial<Pick<Category, 'name' | 'color' | 'icon'>>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('categories').update(input).eq('id', id)
  if (error) throw error
}
```

Create `lib/db/transactions.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/types'

export async function getTransactions(filters?: {
  month?: number
  year?: number
  account_id?: string
  category_id?: string
}): Promise<Transaction[]> {
  const supabase = createClient()
  let query = supabase
    .from('transactions')
    .select('*, categories(*), accounts(*)')
    .order('date', { ascending: false })

  if (filters?.account_id) query = query.eq('account_id', filters.account_id)
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.month && filters?.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updateTransactionCategory(id: string, category_id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').update({ category_id }).eq('id', id)
  if (error) throw error
}

export async function bulkInsertTransactions(rows: Omit<Transaction, 'id' | 'created_at' | 'categories' | 'accounts'>[]): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').insert(rows)
  if (error) throw error
}

export async function getMonthlySummary(year: number): Promise<{ month: number; credit_total: number; debit_total: number }[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, type, source')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
  if (error) throw error

  const byMonth: Record<number, { credit_total: number; debit_total: number }> = {}
  for (let m = 1; m <= 12; m++) byMonth[m] = { credit_total: 0, debit_total: 0 }

  for (const t of data) {
    const month = parseInt(t.date.split('-')[1])
    if (t.source === 'credit_card' || t.source === 'debit_card') {
      if (t.type === 'debit') byMonth[month].debit_total += Math.abs(t.amount)
      else byMonth[month].credit_total += Math.abs(t.amount)
    }
  }

  return Object.entries(byMonth).map(([month, totals]) => ({ month: parseInt(month), ...totals }))
}

export async function getCategoryTotals(month: number, year: number): Promise<{ category_id: string; total: number; category_name: string; color: string }[]> {
  const supabase = createClient()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category_id, categories(name, color)')
    .gte('date', start)
    .lte('date', end)
    .eq('type', 'debit')
  if (error) throw error

  const totals: Record<string, { total: number; category_name: string; color: string }> = {}
  for (const t of data) {
    const cid = t.category_id ?? 'uncategorized'
    const name = (t.categories as any)?.name ?? 'Other'
    const color = (t.categories as any)?.color ?? '#9ca3af'
    if (!totals[cid]) totals[cid] = { total: 0, category_name: name, color }
    totals[cid].total += Math.abs(t.amount)
  }

  return Object.entries(totals).map(([category_id, v]) => ({ category_id, ...v }))
}
```

Create `lib/db/statements.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Statement, ParseStatus } from '@/types'

export async function getStatements(): Promise<Statement[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('statements')
    .select('*, accounts(*)')
    .order('year', { ascending: false })
  if (error) throw error
  return data
}

export async function createStatement(input: {
  account_id: string; month: number; year: number; file_url: string
}): Promise<Statement> {
  const supabase = createClient()
  const { data, error } = await supabase.from('statements').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateStatementStatus(id: string, parse_status: ParseStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('statements').update({ parse_status }).eq('id', id)
  if (error) throw error
}
```

Create `lib/db/balances.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Balance } from '@/types'

export async function getBalances(): Promise<Balance[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('balances')
    .select('*, accounts(*)')
    .order('recorded_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addBalanceSnapshot(input: { account_id: string; amount: number; recorded_at: string }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('balances').insert(input)
  if (error) throw error
}

export async function getNetWorthHistory(): Promise<{ date: string; net_worth: number }[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('balances')
    .select('amount, recorded_at, accounts(type)')
    .order('recorded_at')
  if (error) throw error

  const byDate: Record<string, number> = {}
  for (const b of data) {
    const date = b.recorded_at
    const accountType = (b.accounts as any)?.type
    const sign = accountType === 'credit' ? -1 : 1
    byDate[date] = (byDate[date] ?? 0) + sign * b.amount
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, net_worth]) => ({ date, net_worth }))
}
```

Create `lib/db/income.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Income, IncomeSource } from '@/types'

export async function getIncome(filters?: { month?: number; year?: number }): Promise<Income[]> {
  const supabase = createClient()
  let query = supabase.from('income').select('*, accounts(*)').order('date', { ascending: false })

  if (filters?.month && filters?.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addIncome(input: {
  account_id: string; amount: number; source: IncomeSource; description?: string; date: string
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('income').insert(input)
  if (error) throw error
}
```

Create `lib/db/advice.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { AiAdvice } from '@/types'

export async function getAdvice(month: number, year: number): Promise<AiAdvice | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ai_advice')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveAdvice(month: number, year: number, content: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('ai_advice')
    .upsert({ month, year, content, generated_at: new Date().toISOString() }, { onConflict: 'month,year' })
  if (error) throw error
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/db/ __tests__/
git commit -m "feat: add database query functions"
```

---

## Task 7: Gemini & PDF Parser Utilities

**Files:**
- Create: `lib/gemini.ts`, `lib/pdf-parser.ts`

- [ ] **Step 1: Write test for Gemini parsing**

Create `__tests__/lib/gemini.test.ts`:
```typescript
import { parseStatementWithGemini } from '@/lib/gemini'

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            { date: '2024-01-15', description: 'CARREFOUR', amount: 150, type: 'debit', category: 'Food', is_income: false }
          ])
        }
      })
    })
  }))
}))

test('parseStatementWithGemini returns parsed transactions', async () => {
  const result = await parseStatementWithGemini('raw pdf text here')
  expect(result).toHaveLength(1)
  expect(result[0].description).toBe('CARREFOUR')
  expect(result[0].category).toBe('Food')
  expect(result[0].is_income).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/gemini.test.ts --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement Gemini utility**

Create `lib/gemini.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ParsedTransaction } from '@/types'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Healthcare', 'Salary', 'Transfer', 'Other']

const PARSE_PROMPT = (text: string) => `
You are a financial data extractor. Parse the following bank statement text and return a JSON array of transactions.

For each transaction return:
- date: ISO date string (YYYY-MM-DD)
- description: merchant/description text
- amount: absolute numeric value (always positive)
- type: "debit" for money going out, "credit" for money coming in
- category: one of [${CATEGORIES.join(', ')}]
- is_income: true if this appears to be salary or regular income (large recurring credit), false otherwise

Return ONLY a valid JSON array, no markdown, no explanation.

Bank statement text:
${text}
`

const ADVICE_PROMPT = (summary: string) => `
You are a personal finance advisor. Based on the following monthly spending summary, provide practical advice.

${summary}

Provide:
1. Top 3 spending categories and whether they seem high
2. Specific actionable suggestions to reduce spending
3. Tips to improve savings rate

Format your response in clean markdown with headers and bullet points. Be specific and practical. Currency is AED (UAE Dirhams).
`

export async function parseStatementWithGemini(rawText: string): Promise<ParsedTransaction[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(PARSE_PROMPT(rawText))
  const text = result.response.text().trim()
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(cleaned)
}

export async function generateAdviceWithGemini(summary: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(ADVICE_PROMPT(summary))
  return result.response.text()
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/gemini.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Write test for PDF parser**

Create `__tests__/lib/pdf-parser.test.ts`:
```typescript
import { extractTextFromPdf } from '@/lib/pdf-parser'

jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: 'extracted text from pdf' }))

test('extractTextFromPdf returns text string', async () => {
  const buffer = Buffer.from('fake pdf content')
  const result = await extractTextFromPdf(buffer)
  expect(result).toBe('extracted text from pdf')
})
```

- [ ] **Step 6: Implement PDF parser**

Create `lib/pdf-parser.ts`:
```typescript
import pdfParse from 'pdf-parse'

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
npx jest __tests__/lib/pdf-parser.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/gemini.ts lib/pdf-parser.ts __tests__/
git commit -m "feat: add Gemini AI and PDF parser utilities"
```

---

## Task 8: API Routes — Accounts, Categories, Income, Balances

**Files:**
- Create: `app/api/accounts/route.ts`, `app/api/categories/route.ts`, `app/api/income/route.ts`, `app/api/balances/route.ts`

- [ ] **Step 1: Accounts API route**

Create `app/api/accounts/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAccounts, createAccount, updateAccountBalance, deleteAccount } from '@/lib/db/accounts'

export async function GET() {
  try {
    const accounts = await getAccounts()
    return NextResponse.json(accounts)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const account = await createAccount(body)
    return NextResponse.json(account, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, current_balance } = await req.json()
    await updateAccountBalance(id, current_balance)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await deleteAccount(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Categories API route**

Create `app/api/categories/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCategories, updateCategory } from '@/lib/db/categories'

export async function GET() {
  try {
    return NextResponse.json(await getCategories())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    await updateCategory(id, updates)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Income API route**

Create `app/api/income/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getIncome, addIncome } from '@/lib/db/income'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    return NextResponse.json(await getIncome({ month, year }))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await addIncome(await req.json())
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Balances API route**

Create `app/api/balances/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getBalances, addBalanceSnapshot, getNetWorthHistory } from '@/lib/db/balances'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  try {
    if (searchParams.get('history') === 'true') {
      return NextResponse.json(await getNetWorthHistory())
    }
    return NextResponse.json(await getBalances())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await addBalanceSnapshot(await req.json())
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 5: Transactions API route**

Create `app/api/transactions/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getTransactions, updateTransactionCategory, getMonthlySummary, getCategoryTotals } from '@/lib/db/transactions'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  try {
    if (searchParams.get('summary') === 'monthly') {
      const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
      return NextResponse.json(await getMonthlySummary(year))
    }
    if (searchParams.get('summary') === 'categories') {
      const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
      const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
      return NextResponse.json(await getCategoryTotals(month, year))
    }
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const account_id = searchParams.get('account_id') ?? undefined
    const category_id = searchParams.get('category_id') ?? undefined
    return NextResponse.json(await getTransactions({ month, year, account_id, category_id }))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, category_id } = await req.json()
    await updateTransactionCategory(id, category_id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/
git commit -m "feat: add CRUD API routes for accounts, categories, income, balances, transactions"
```

---

## Task 9: Statement Upload & Parse API

**Files:**
- Create: `app/api/statements/upload/route.ts`, `app/api/statements/parse/route.ts`, `app/api/statements/confirm/route.ts`

- [ ] **Step 1: Upload route**

Create `app/api/statements/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStatement } from '@/lib/db/statements'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const account_id = formData.get('account_id') as string
    const month = parseInt(formData.get('month') as string)
    const year = parseInt(formData.get('year') as string)

    const supabase = createAdminClient()
    const fileName = `${account_id}/${year}-${month}-${Date.now()}.pdf`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from('statements')
      .upload(fileName, buffer, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('statements').getPublicUrl(fileName)

    const statement = await createStatement({ account_id, month, year, file_url: publicUrl })
    return NextResponse.json(statement, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Parse route**

Create `app/api/statements/parse/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractTextFromPdf } from '@/lib/pdf-parser'
import { parseStatementWithGemini } from '@/lib/gemini'
import { updateStatementStatus } from '@/lib/db/statements'

export async function POST(req: NextRequest) {
  const { statement_id, file_url } = await req.json()
  try {
    const supabase = createAdminClient()

    // Download the PDF from Supabase Storage
    const filePath = new URL(file_url).pathname.split('/statements/')[1]
    const { data, error } = await supabase.storage.from('statements').download(filePath)
    if (error) throw error

    const buffer = Buffer.from(await data.arrayBuffer())
    const rawText = await extractTextFromPdf(buffer)
    const parsed = await parseStatementWithGemini(rawText)

    await updateStatementStatus(statement_id, 'parsed')
    return NextResponse.json({ transactions: parsed })
  } catch (e: any) {
    await updateStatementStatus(statement_id, 'failed').catch(() => {})
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Confirm route (saves reviewed transactions)**

Create `app/api/statements/confirm/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { bulkInsertTransactions } from '@/lib/db/transactions'
import { addIncome } from '@/lib/db/income'
import { getCategories } from '@/lib/db/categories'
import type { ParsedTransaction, TransactionSource } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { statement_id, account_id, source, transactions }: {
      statement_id: string
      account_id: string
      source: TransactionSource
      transactions: (ParsedTransaction & { category_id?: string })[]
    } = await req.json()

    const categories = await getCategories()
    const categoryMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c.id]))

    const incomeRows = transactions.filter(t => t.is_income)
    const txRows = transactions.filter(t => !t.is_income)

    await bulkInsertTransactions(txRows.map(t => ({
      account_id,
      statement_id,
      date: t.date,
      description: t.description,
      amount: t.type === 'debit' ? -Math.abs(t.amount) : Math.abs(t.amount),
      type: t.type,
      category_id: t.category_id ?? categoryMap[t.category.toLowerCase()] ?? null,
      source,
    })))

    for (const t of incomeRows) {
      await addIncome({
        account_id,
        amount: Math.abs(t.amount),
        source: 'salary',
        description: t.description,
        date: t.date,
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/statements/
git commit -m "feat: add statement upload, parse, and confirm API routes"
```

---

## Task 10: Advice API Route

**Files:**
- Create: `app/api/advice/route.ts`

- [ ] **Step 1: Create advice route**

Create `app/api/advice/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdvice, saveAdvice } from '@/lib/db/advice'
import { getCategoryTotals, getMonthlySummary } from '@/lib/db/transactions'
import { getIncome } from '@/lib/db/income'
import { generateAdviceWithGemini } from '@/lib/gemini'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  try {
    const existing = await getAdvice(month, year)
    if (existing && searchParams.get('force') !== 'true') {
      return NextResponse.json(existing)
    }

    const [categoryTotals, monthlyIncome] = await Promise.all([
      getCategoryTotals(month, year),
      getIncome({ month, year }),
    ])

    const totalIncome = monthlyIncome.reduce((s, i) => s + i.amount, 0)
    const totalSpending = categoryTotals.reduce((s, c) => s + c.total, 0)

    const summary = `
Month: ${month}/${year}
Total Income: AED ${totalIncome.toFixed(2)}
Total Spending: AED ${totalSpending.toFixed(2)}
Net Savings: AED ${(totalIncome - totalSpending).toFixed(2)}

Spending by category:
${categoryTotals.map(c => `- ${c.category_name}: AED ${c.total.toFixed(2)}`).join('\n')}
`

    const content = await generateAdviceWithGemini(summary)
    await saveAdvice(month, year, content)

    return NextResponse.json({ month, year, content, generated_at: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/advice/
git commit -m "feat: add AI advice API route"
```

---

## Task 11: Accounts Page

**Files:**
- Create: `app/(protected)/accounts/page.tsx`

- [ ] **Step 1: Build accounts page**

Create `app/(protected)/accounts/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import type { Account, AccountType } from '@/types'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', bank_name: '', type: 'debit' as AccountType })
  const [balanceInput, setBalanceInput] = useState<Record<string, string>>({})

  async function load() {
    const res = await fetch('/api/accounts')
    setAccounts(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowForm(false)
    setForm({ name: '', bank_name: '', type: 'debit' })
    load()
  }

  async function handleUpdateBalance(id: string) {
    const val = parseFloat(balanceInput[id])
    if (isNaN(val)) return
    await fetch('/api/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, current_balance: val }) })
    await fetch('/api/balances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account_id: id, amount: val, recorded_at: new Date().toISOString().split('T')[0] }) })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account and all its data?')) return
    await fetch('/api/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">+ Add Account</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Account Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-3 py-1.5 text-sm" required placeholder="e.g. ADCB Salary" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Bank</label>
            <input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className="border rounded px-3 py-1.5 text-sm" required placeholder="e.g. ADCB" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))} className="border rounded px-3 py-1.5 text-sm">
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm">Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-1.5 text-sm">Cancel</button>
        </form>
      )}

      <div className="grid gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{acc.name}</p>
              <p className="text-sm text-gray-500">{acc.bank_name} · {acc.type}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">AED {acc.current_balance.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
              <input
                type="number"
                placeholder="Update balance"
                value={balanceInput[acc.id] ?? ''}
                onChange={e => setBalanceInput(b => ({ ...b, [acc.id]: e.target.value }))}
                className="border rounded px-2 py-1 text-sm w-36"
              />
              <button onClick={() => handleUpdateBalance(acc.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Update</button>
              <button onClick={() => handleDelete(acc.id)} className="text-red-500 text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test in browser**

```
Navigate to /accounts
- Add an account (e.g. "ADCB Salary", type: debit)
- Verify it appears in the list
- Enter a balance and click Update — verify it changes
```

- [ ] **Step 3: Commit**

```bash
git add app/\(protected\)/accounts/
git commit -m "feat: add accounts management page"
```

---

## Task 12: Statements Upload & Review Page

**Files:**
- Create: `app/(protected)/statements/page.tsx`, `components/statements/UploadForm.tsx`, `components/statements/ReviewTable.tsx`

- [ ] **Step 1: ReviewTable component**

Create `components/statements/ReviewTable.tsx`:
```typescript
'use client'
import { useState } from 'react'
import type { ParsedTransaction } from '@/types'

interface Props {
  transactions: ParsedTransaction[]
  categories: { id: string; name: string }[]
  onConfirm: (transactions: ParsedTransaction[]) => void
  onCancel: () => void
}

export function ReviewTable({ transactions: initial, categories, onConfirm, onCancel }: Props) {
  const [rows, setRows] = useState(initial)

  function updateRow(index: number, updates: Partial<ParsedTransaction>) {
    setRows(r => r.map((row, i) => i === index ? { ...row, ...updates } : row))
  }

  function removeRow(index: number) {
    setRows(r => r.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Amount (AED)</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Income?</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-1.5 pr-4">
                  <input type="date" value={row.date} onChange={e => updateRow(i, { date: e.target.value })} className="border rounded px-2 py-0.5 text-xs" />
                </td>
                <td className="py-1.5 pr-4">
                  <input value={row.description} onChange={e => updateRow(i, { description: e.target.value })} className="border rounded px-2 py-0.5 text-xs w-48" />
                </td>
                <td className="py-1.5 pr-4">
                  <input type="number" value={row.amount} onChange={e => updateRow(i, { amount: parseFloat(e.target.value) })} className="border rounded px-2 py-0.5 text-xs w-24" />
                </td>
                <td className="py-1.5 pr-4">
                  <select value={row.type} onChange={e => updateRow(i, { type: e.target.value as any })} className="border rounded px-2 py-0.5 text-xs">
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </td>
                <td className="py-1.5 pr-4">
                  <select value={row.category} onChange={e => updateRow(i, { category: e.target.value })} className="border rounded px-2 py-0.5 text-xs">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </td>
                <td className="py-1.5 pr-4">
                  <input type="checkbox" checked={row.is_income} onChange={e => updateRow(i, { is_income: e.target.checked })} />
                </td>
                <td className="py-1.5">
                  <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={() => onConfirm(rows)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">
          Save {rows.length} transactions
        </button>
        <button onClick={onCancel} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Statements page**

Create `app/(protected)/statements/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { ReviewTable } from '@/components/statements/ReviewTable'
import type { Account, Category, ParsedTransaction, Statement } from '@/types'

type Step = 'list' | 'upload' | 'parsing' | 'review' | 'saving'

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep] = useState<Step>('list')
  const [parsedTxs, setParsedTxs] = useState<ParsedTransaction[]>([])
  const [currentStatement, setCurrentStatement] = useState<Statement | null>(null)
  const [form, setForm] = useState({ account_id: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) })
  const [error, setError] = useState('')

  async function load() {
    const [stRes, acRes, catRes] = await Promise.all([
      fetch('/api/statements'), fetch('/api/accounts'), fetch('/api/categories')
    ])
    // Note: statements API not yet defined — add it below
    setAccounts(await acRes.json())
    setCategories(await catRes.json())
  }

  useEffect(() => { load() }, [])

  async function handleUploadAndParse(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const fileInput = document.getElementById('pdf-file') as HTMLInputElement
    if (!fileInput.files?.[0]) return

    setStep('parsing')
    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    formData.append('account_id', form.account_id)
    formData.append('month', form.month)
    formData.append('year', form.year)

    const uploadRes = await fetch('/api/statements/upload', { method: 'POST', body: formData })
    if (!uploadRes.ok) { setError('Upload failed'); setStep('upload'); return }
    const statement: Statement = await uploadRes.json()
    setCurrentStatement(statement)

    const parseRes = await fetch('/api/statements/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement_id: statement.id, file_url: statement.file_url })
    })
    if (!parseRes.ok) { setError('Parsing failed'); setStep('upload'); return }
    const { transactions } = await parseRes.json()
    setParsedTxs(transactions)
    setStep('review')
  }

  async function handleConfirm(transactions: ParsedTransaction[]) {
    if (!currentStatement) return
    setStep('saving')
    const account = accounts.find(a => a.id === currentStatement.account_id)
    const source = account?.type === 'credit' ? 'credit_card' : 'debit_card'

    await fetch('/api/statements/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement_id: currentStatement.id, account_id: currentStatement.account_id, source, transactions })
    })
    setStep('list')
    load()
  }

  if (step === 'upload' || step === 'list') return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statements</h1>
        <button onClick={() => setStep('upload')} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">+ Upload PDF</button>
      </div>

      {step === 'upload' && (
        <form onSubmit={handleUploadAndParse} className="bg-white p-6 rounded-lg shadow mb-6 flex flex-col gap-4 max-w-lg">
          <h2 className="font-semibold">Upload Statement PDF</h2>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Account</label>
            <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank_name})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Month</label>
              <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">PDF File</label>
            <input id="pdf-file" type="file" accept=".pdf" className="text-sm" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Upload & Parse</button>
            <button type="button" onClick={() => setStep('list')} className="text-gray-500 text-sm px-4 py-2">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )

  if (step === 'parsing') return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Parsing statement with AI...</p>
      </div>
    </div>
  )

  if (step === 'review') return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Review Transactions</h1>
      <p className="text-gray-500 text-sm mb-6">Review AI-parsed transactions. Edit, delete, or fix any errors before saving.</p>
      <div className="bg-white rounded-lg shadow p-6">
        <ReviewTable transactions={parsedTxs} categories={categories} onConfirm={handleConfirm} onCancel={() => setStep('list')} />
      </div>
    </div>
  )

  if (step === 'saving') return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-600">Saving transactions...</p>
    </div>
  )

  return null
}
```

- [ ] **Step 3: Add statements GET route**

Create `app/api/statements/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getStatements } from '@/lib/db/statements'

export async function GET() {
  try {
    return NextResponse.json(await getStatements())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Test the upload flow in browser**

```
1. Go to /accounts — add at least one account
2. Go to /statements — click Upload PDF
3. Select account, month, year, attach a real bank PDF
4. Click Upload & Parse — wait for AI parsing
5. Review the table — fix any wrong dates/amounts/categories
6. Click Save — verify transactions appear in /transactions
```

- [ ] **Step 5: Commit**

```bash
git add app/\(protected\)/statements/ app/api/statements/ components/statements/
git commit -m "feat: add statement upload, AI parse, and review flow"
```

---

## Task 13: Income Page

**Files:**
- Create: `app/(protected)/income/page.tsx`

- [ ] **Step 1: Build income page**

Create `app/(protected)/income/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import type { Account, Income, IncomeSource } from '@/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function IncomePage() {
  const [income, setIncome] = useState<Income[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    account_id: '', amount: '', source: 'salary' as IncomeSource,
    description: '', date: new Date().toISOString().split('T')[0]
  })
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })

  async function load() {
    const [iRes, aRes] = await Promise.all([
      fetch(`/api/income?month=${filter.month}&year=${filter.year}`),
      fetch('/api/accounts')
    ])
    setIncome(await iRes.json())
    setAccounts(await aRes.json())
  }

  useEffect(() => { load() }, [filter.month, filter.year])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
    })
    setShowForm(false)
    setForm({ account_id: '', amount: '', source: 'salary', description: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const total = income.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Income</h1>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">+ Add Income</button>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={filter.month} onChange={e => setFilter(f => ({ ...f, month: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm">
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <input type="number" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm w-24" />
      </div>

      <div className="bg-indigo-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-indigo-600">Total Income this month</p>
        <p className="text-3xl font-bold text-indigo-700">AED {total.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Account</label>
            <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Amount (AED)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" required />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Source</label>
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as IncomeSource }))} className="border rounded px-3 py-1.5 text-sm w-full">
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Description (optional)</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <div className="col-span-2 flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr></thead>
          <tbody>
            {income.map(i => (
              <tr key={i.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i.date}</td>
                <td className="px-4 py-3 text-gray-600">{i.description ?? '—'}</td>
                <td className="px-4 py-3 capitalize">{i.source}</td>
                <td className="px-4 py-3">{(i.accounts as any)?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">AED {i.amount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(protected\)/income/
git commit -m "feat: add income tracking page"
```

---

## Task 14: Transactions Page

**Files:**
- Create: `app/(protected)/transactions/page.tsx`

- [ ] **Step 1: Build transactions page**

Create `app/(protected)/transactions/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import type { Account, Category, Transaction } from '@/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), account_id: '', category_id: '' })

  async function load() {
    const params = new URLSearchParams()
    if (filter.month) params.set('month', String(filter.month))
    if (filter.year) params.set('year', String(filter.year))
    if (filter.account_id) params.set('account_id', filter.account_id)
    if (filter.category_id) params.set('category_id', filter.category_id)

    const [tRes, aRes, cRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch('/api/accounts'),
      fetch('/api/categories')
    ])
    setTransactions(await tRes.json())
    setAccounts(await aRes.json())
    setCategories(await cRes.json())
  }

  useEffect(() => { load() }, [filter.month, filter.year, filter.account_id, filter.category_id])

  async function handleCategoryChange(id: string, category_id: string) {
    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, category_id })
    })
    setTransactions(ts => ts.map(t => t.id === id ? { ...t, category_id, categories: categories.find(c => c.id === category_id) } : t))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filter.month} onChange={e => setFilter(f => ({ ...f, month: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm">
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <input type="number" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm w-24" />
        <select value={filter.account_id} onChange={e => setFilter(f => ({ ...f, account_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filter.category_id} onChange={e => setFilter(f => ({ ...f, category_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr></thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{t.description}</td>
                <td className="px-4 py-3 text-gray-500">{(t.accounts as any)?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={t.category_id ?? ''}
                    onChange={e => handleCategoryChange(t.id, e.target.value)}
                    className="border rounded px-2 py-0.5 text-xs"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </td>
                <td className={`px-4 py-3 text-right font-medium ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.type === 'credit' ? '+' : '-'}AED {Math.abs(t.amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-center text-gray-400 py-12">No transactions found</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(protected\)/transactions/
git commit -m "feat: add transactions page with filters and inline category editing"
```

---

## Task 15: Settings Page (Categories)

**Files:**
- Create: `app/(protected)/settings/page.tsx`

- [ ] **Step 1: Build settings page**

Create `app/(protected)/settings/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import type { Category } from '@/types'

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Record<string, Partial<Category>>>({})

  async function load() {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { load() }, [])

  function handleEdit(id: string, field: keyof Category, value: string) {
    setEditing(e => ({ ...e, [id]: { ...e[id], [field]: value } }))
  }

  async function handleSave(id: string) {
    const updates = editing[id]
    if (!updates) return
    await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    setEditing(e => { const n = { ...e }; delete n[id]; return n })
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <h2 className="text-lg font-semibold mb-4">Categories</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3">Icon</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Color</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {categories.map(cat => {
              const edits = editing[cat.id] ?? {}
              return (
                <tr key={cat.id} className="border-b">
                  <td className="px-4 py-3">
                    <input value={edits.icon ?? cat.icon} onChange={e => handleEdit(cat.id, 'icon', e.target.value)} className="border rounded px-2 py-0.5 text-sm w-16 text-center" />
                  </td>
                  <td className="px-4 py-3">
                    <input value={edits.name ?? cat.name} onChange={e => handleEdit(cat.id, 'name', e.target.value)} className="border rounded px-2 py-0.5 text-sm w-36" />
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <input type="color" value={edits.color ?? cat.color} onChange={e => handleEdit(cat.id, 'color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <span className="text-xs text-gray-400">{edits.color ?? cat.color}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editing[cat.id] && (
                      <button onClick={() => handleSave(cat.id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs">Save</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(protected\)/settings/
git commit -m "feat: add settings page for category management"
```

---

## Task 16: Dashboard Charts Components

**Files:**
- Create: `components/dashboard/SummaryCards.tsx`, `components/dashboard/CategoryDonutChart.tsx`, `components/dashboard/MonthlyTrendChart.tsx`, `components/dashboard/NetWorthChart.tsx`, `components/dashboard/AiAdvicePanel.tsx`

- [ ] **Step 1: SummaryCards component**

Create `components/dashboard/SummaryCards.tsx`:
```typescript
interface Props {
  creditSpending: number
  debitSpending: number
  totalIncome: number
}

export function SummaryCards({ creditSpending, debitSpending, totalIncome }: Props) {
  const totalSpending = creditSpending + debitSpending
  const netSavings = totalIncome - totalSpending

  const cards = [
    { label: 'Credit Card Spending', value: creditSpending, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Debit Card Spending', value: debitSpending, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Income', value: totalIncome, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Net Savings', value: netSavings, color: netSavings >= 0 ? 'text-indigo-600' : 'text-red-600', bg: netSavings >= 0 ? 'bg-indigo-50' : 'bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className={`${card.bg} rounded-lg p-4`}>
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>
            AED {Math.abs(card.value).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
          </p>
          {card.label === 'Net Savings' && card.value < 0 && (
            <p className="text-xs text-red-500 mt-1">Overspent this month</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: CategoryDonutChart component**

Create `components/dashboard/CategoryDonutChart.tsx`:
```typescript
'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CategoryTotal {
  category_id: string
  category_name: string
  total: number
  color: string
}

interface Props {
  data: CategoryTotal[]
}

export function CategoryDonutChart({ data }: Props) {
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No spending data</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category_name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `AED ${value.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: MonthlyTrendChart component**

Create `components/dashboard/MonthlyTrendChart.tsx`:
```typescript
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface MonthSummary {
  month: number
  credit_total: number
  debit_total: number
}

interface Props {
  data: MonthSummary[]
}

export function MonthlyTrendChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: MONTH_LABELS[d.month - 1],
    'Credit Card': d.credit_total,
    'Debit Card': d.debit_total,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `AED ${v.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} />
        <Legend />
        <Bar dataKey="Credit Card" fill="#f97316" />
        <Bar dataKey="Debit Card" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: NetWorthChart component**

Create `components/dashboard/NetWorthChart.tsx`:
```typescript
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface NetWorthPoint {
  date: string
  net_worth: number
}

interface Props {
  data: NetWorthPoint[]
}

export function NetWorthChart({ data }: Props) {
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">Add balance snapshots to track net worth</div>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `AED ${v.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} />
        <Line type="monotone" dataKey="net_worth" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 5: AiAdvicePanel component**

Create `components/dashboard/AiAdvicePanel.tsx`:
```typescript
'use client'
import { useState } from 'react'

interface Props {
  month: number
  year: number
  initialContent: string | null
}

export function AiAdvicePanel({ month, year, initialContent }: Props) {
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)

  async function generate(force = false) {
    setLoading(true)
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    if (force) params.set('force', 'true')
    const res = await fetch(`/api/advice?${params}`)
    const data = await res.json()
    setContent(data.content)
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-indigo-900">AI Financial Advice</h2>
        <div className="flex gap-2">
          {content && <button onClick={() => generate(true)} className="text-xs text-indigo-600 hover:underline">Regenerate</button>}
          {!content && <button onClick={() => generate(false)} disabled={loading} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">{loading ? 'Generating...' : 'Generate Advice'}</button>}
        </div>
      </div>
      {loading && <div className="animate-pulse space-y-2"><div className="h-3 bg-indigo-100 rounded w-3/4"></div><div className="h-3 bg-indigo-100 rounded w-1/2"></div></div>}
      {content && !loading && (
        <div className="prose prose-sm prose-indigo max-w-none text-gray-700 whitespace-pre-line">{content}</div>
      )}
      {!content && !loading && (
        <p className="text-gray-400 text-sm">Click "Generate Advice" to get AI-powered insights for this month.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/
git commit -m "feat: add dashboard chart and summary components"
```

---

## Task 17: Dashboard Page

**Files:**
- Create: `app/(protected)/page.tsx`

- [ ] **Step 1: Build dashboard page**

Create `app/(protected)/page.tsx`:
```typescript
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart'
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart'
import { NetWorthChart } from '@/components/dashboard/NetWorthChart'
import { AiAdvicePanel } from '@/components/dashboard/AiAdvicePanel'
import { getTransactions, getMonthlySummary, getCategoryTotals } from '@/lib/db/transactions'
import { getIncome } from '@/lib/db/income'
import { getNetWorthHistory } from '@/lib/db/balances'
import { getAdvice } from '@/lib/db/advice'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { month?: string; year?: string }
}) {
  const now = new Date()
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))

  const [transactions, monthlySummary, categoryTotals, income, netWorthHistory, advice] = await Promise.all([
    getTransactions({ month, year }),
    getMonthlySummary(year),
    getCategoryTotals(month, year),
    getIncome({ month, year }),
    getNetWorthHistory(),
    getAdvice(month, year),
  ])

  const creditSpending = transactions
    .filter(t => t.source === 'credit_card' && t.type === 'debit')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const debitSpending = transactions
    .filter(t => t.source === 'debit_card' && t.type === 'debit')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const totalIncome = income.reduce((s, i) => s + i.amount, 0)

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2 items-center text-sm text-gray-500">
          <span>{MONTHS[month - 1]} {year}</span>
        </div>
      </div>

      <SummaryCards creditSpending={creditSpending} debitSpending={debitSpending} totalIncome={totalIncome} />

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Spending by Category</h2>
          <CategoryDonutChart data={categoryTotals} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Monthly Spending Trend</h2>
          <MonthlyTrendChart data={monthlySummary} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Net Worth Over Time</h2>
        <NetWorthChart data={netWorthHistory} />
      </div>

      <AiAdvicePanel month={month} year={year} initialContent={advice?.content ?? null} />
    </div>
  )
}
```

- [ ] **Step 2: Test dashboard in browser**

```
1. Start dev server: npm run dev
2. Navigate to / — verify summary cards show AED 0.00 (no data yet)
3. Upload a statement via /statements
4. Return to / — verify cards update with real spending data
5. Verify donut chart shows categories
6. Verify bar chart shows monthly trend
7. Click Generate Advice — verify Gemini returns advice text
```

- [ ] **Step 3: Commit**

```bash
git add app/\(protected\)/page.tsx
git commit -m "feat: add main dashboard page with all charts and summary"
```

---

## Task 18: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/financing.git
git push -u origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to vercel.com → New Project → Import your GitHub repo
2. Framework: Next.js (auto-detected)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Click Deploy

- [ ] **Step 3: Verify production deployment**

```
1. Open the Vercel URL
2. Log in with your credentials
3. Upload a PDF statement
4. Verify parsing works
5. Verify dashboard shows data
```

- [ ] **Step 4: Update Supabase Auth settings**

In Supabase Dashboard → Authentication → URL Configuration:
- Add your Vercel URL to Site URL: `https://your-app.vercel.app`
- Add to Redirect URLs: `https://your-app.vercel.app/**`

---

## Self-Review Against Spec

**Spec coverage check:**
- [x] PDF upload → parse → review → save flow (Tasks 9, 12)
- [x] Credit card & debit card statement support (Task 9 confirm route handles source)
- [x] Gemini categorization (Task 7)
- [x] Salary/income detection from statements (Task 9 confirm route)
- [x] Manual income entry (Task 13)
- [x] Manual balance entry (Task 11 accounts page)
- [x] Dashboard summary cards (Task 16, 17)
- [x] Spending by category donut chart (Task 16, 17)
- [x] Monthly spending trend bar chart (Task 16, 17)
- [x] Net worth line chart (Task 16, 17)
- [x] Transactions table with filters + inline category editing (Task 14)
- [x] AI advice panel (Task 16, 17)
- [x] Accounts management (Task 11)
- [x] Category settings (Task 15)
- [x] Auth (Task 5)
- [x] All 7 routes defined in spec (Tasks 5, 11, 12, 13, 14, 15, 17)
- [x] AED currency throughout
- [x] Deployed on Vercel (Task 18)
