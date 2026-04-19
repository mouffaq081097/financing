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
