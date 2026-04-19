# Personal Finance App — Design Spec
**Date:** 2026-04-19  
**Status:** Approved

---

## Overview

A personal web-based finance tracking app for one user. Parses credit card and debit card PDF bank statements from multiple banks, categorizes transactions using Gemini AI, tracks salary and other income, and provides a dashboard with spending breakdowns, net worth tracking, and AI-generated savings advice. Currency: AED (UAE Dirhams).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js (App Router), deployed on Vercel |
| Database + Auth + Storage | Supabase (Postgres, Auth, Storage) — free tier |
| AI | Gemini API (Google) |
| PDF Parsing | `pdf-parse` (Node.js library) |

---

## Architecture

```
Browser (Next.js on Vercel)
       │
       ▼
Next.js API Routes (serverless functions)
       │
       ├──► Supabase Postgres  — transactions, accounts, balances, categories, income
       ├──► Supabase Storage   — uploaded PDF files
       ├──► Supabase Auth      — username/password authentication
       │
       ├──► pdf-parse          — extracts raw text from uploaded PDFs
       │
       └──► Gemini API         — categorizes transactions, generates spending advice
```

- All API logic lives in Next.js API routes (serverless)
- Supabase handles all persistence and authentication
- No separate backend service required

---

## Data Model

### `accounts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "ADCB Salary Account" |
| bank_name | text | e.g. "ADCB", "Emirates NBD" |
| type | enum | `credit`, `debit`, `savings` |
| current_balance | numeric | Latest known balance in AED |
| created_at | timestamp | |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → accounts | |
| statement_id | uuid FK → statements | |
| date | date | Transaction date |
| description | text | Raw description from bank |
| amount | numeric | Positive = credit, negative = debit |
| type | enum | `debit`, `credit` |
| category_id | uuid FK → categories | AI-assigned, user-editable |
| source | enum | `credit_card`, `debit_card`, `manual` |
| created_at | timestamp | |

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Food", "Transport", "Shopping" |
| color | text | Hex color for charts |
| icon | text | Emoji or icon name |

**Default categories:** Food, Transport, Shopping, Utilities, Entertainment, Healthcare, Salary, Transfer, Other

### `statements`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → accounts | |
| month | integer | 1–12 |
| year | integer | |
| upload_date | timestamp | |
| file_url | text | Supabase Storage URL |
| parse_status | enum | `pending`, `parsed`, `failed` |

### `balances`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → accounts | |
| amount | numeric | Balance snapshot in AED |
| recorded_at | date | Date of snapshot |

### `income`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → accounts | |
| amount | numeric | AED |
| source | enum | `salary`, `freelance`, `other` |
| description | text | Optional note |
| date | date | |

### `ai_advice`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| month | integer | 1–12 |
| year | integer | |
| content | text | Gemini-generated advice (markdown) |
| generated_at | timestamp | |

---

## PDF Parsing & Import Flow

1. **Upload** — User selects a PDF and the associated account. File is uploaded to Supabase Storage. A `statements` record is created with status `pending`.

2. **Extract** — Next.js API route uses `pdf-parse` to extract raw text from the PDF.

3. **Parse & Categorize** — Raw text is sent to Gemini with a prompt instructing it to:
   - Return structured JSON: `[{ date, description, amount, type }]`
   - Assign a category to each transaction from the default category list
   - Flag incoming credits that appear to be salary or income (large recurring credits)

4. **Review Screen** — User sees all parsed transactions in a table before saving. They can:
   - Edit date, description, amount, or category for any row
   - Delete rows that are duplicates or incorrect
   - Confirm and save

5. **Save** — Confirmed transactions saved to `transactions` table. Salary/income entries saved to `income` table. Statement status updated to `parsed`.

**Multi-bank handling:** Gemini reads raw text and infers structure without needing manual bank templates. The review screen is the safety net for parsing errors.

---

## Dashboard

### Summary Cards (current month, top row)
- Total credit card spending (AED)
- Total debit card spending (AED)
- Total income received (AED)
- Net savings = income − total spending (AED)

### Charts (middle row)
- **Spending by category** — donut chart, filterable by month and account
- **Monthly spending trend** — bar chart, last 6 months, credit vs debit split
- **Net worth over time** — line chart calculated as: `sum of savings/debit balances − credit card outstanding balances`, plotted using `balances` snapshots

### Transactions Table (bottom)
- Filterable by: month, account, category
- Columns: date, description, amount, category, account
- Inline category editing per row

### Manual Entry Panel (sidebar or modal)
- Add/update current balance for any account (creates a `balances` snapshot)
- Add manual income entry (amount, source, date, description)

### AI Advice Panel
- Generated by Gemini once per month (or on demand)
- Content: top spending categories, comparison to previous month, specific actionable suggestions to reduce spending and improve savings
- Stored per month so it doesn't regenerate on every page load

---

## Authentication

- Supabase Auth with email/password
- Single user — no multi-user support needed
- Protected routes: all pages require login
- Session persisted via Supabase client-side session

---

## Pages / Routes

| Route | Description |
|---|---|
| `/login` | Login page |
| `/` (dashboard) | Main dashboard with all charts and summary |
| `/transactions` | Full transactions table with filters |
| `/statements` | Upload PDFs, view past uploads, re-parse |
| `/accounts` | Manage accounts, enter current balances |
| `/income` | View and manually add income entries |
| `/settings` | Manage categories (rename, merge, recolor) |

---

## Key Constraints

- Currency is always AED — no multi-currency support
- Single user — no sharing or teams
- Gemini is the only AI provider
- No mobile app — responsive web only
- Free tier hosting (Vercel + Supabase) — no heavy compute
