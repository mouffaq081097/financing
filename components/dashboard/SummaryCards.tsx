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
