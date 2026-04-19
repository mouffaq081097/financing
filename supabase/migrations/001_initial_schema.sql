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