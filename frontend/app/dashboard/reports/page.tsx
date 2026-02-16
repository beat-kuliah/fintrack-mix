'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { TrendingUp, TrendingDown, Wallet, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { apiClient, TransactionSummary } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

export default function ReportsPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getTransactionSummary()
      setSummary(data)
    } catch (error: any) {
      console.error('Error fetching summary:', error)
      toast.error(error.message || 'Gagal memuat summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Reports 📊
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Analyze your financial data with detailed reports
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 sm:py-12 lg:py-16">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
            <p className="text-light-500 dark:text-dark-500 text-sm">Loading reports...</p>
          </div>
        ) : !summary ? (
          <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
                No data available yet
              </p>
              <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
                Start adding transactions to generate insightful reports
              </p>
              <button
                onClick={() => router.push('/dashboard/transactions')}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                Go to Transactions
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-green-200 dark:border-green-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                      Total Income
                    </span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.total_income)}
                </p>
              </div>

              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-red-200 dark:border-red-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                      <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                      Total Expense
                    </span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(summary.total_expense)}
                </p>
              </div>

              <div className={`glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border ${
                summary.balance >= 0
                  ? 'border-primary-200 dark:border-primary-800/50'
                  : 'border-red-200 dark:border-red-800/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                      summary.balance >= 0
                        ? 'bg-primary-500/10 dark:bg-primary-500/20'
                        : 'bg-red-500/10 dark:bg-red-500/20'
                    }`}>
                      <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        summary.balance >= 0
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                      Balance
                    </span>
                  </div>
                </div>
                <p className={`text-lg sm:text-xl font-bold ${
                  summary.balance >= 0
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {summary.balance < 0 ? '-' : ''}{formatCurrency(Math.abs(summary.balance))}
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Income by Category */}
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
                <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-4">
                  Income by Category
                </h2>
                {!summary.income_by_category || summary.income_by_category.length === 0 ? (
                  <p className="text-sm text-light-500 dark:text-dark-500 text-center py-8">
                    No income data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {summary.income_by_category.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-light-100 dark:bg-dark-800/50">
                        <span className="text-sm font-medium text-light-700 dark:text-dark-300">
                          {item.category || 'Uncategorized'}
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expense by Category */}
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
                <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-4">
                  Expense by Category
                </h2>
                {!summary.expense_by_category || summary.expense_by_category.length === 0 ? (
                  <p className="text-sm text-light-500 dark:text-dark-500 text-center py-8">
                    No expense data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {summary.expense_by_category.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-light-100 dark:bg-dark-800/50">
                        <span className="text-sm font-medium text-light-700 dark:text-dark-300">
                          {item.category || 'Uncategorized'}
                        </span>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

