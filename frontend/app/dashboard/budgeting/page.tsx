'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Wallet, AlertCircle, CheckCircle2, TrendingDown, Plus, Loader2, Trash2 } from 'lucide-react'
import { apiClient, Budget, Transaction } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const toast = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [budgetsData, transactionsData] = await Promise.all([
        apiClient.getBudgets({ month: selectedMonth, year: selectedYear }),
        apiClient.getTransactions(),
      ])
      setBudgets(budgetsData || [])
      
      // Filter transactions for current month/year
      const currentMonthTransactions = (transactionsData || []).filter(t => {
        const date = new Date(t.transaction_date)
        return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear
      })
      setTransactions(currentMonthTransactions)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear])

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const remaining = totalBudget - totalExpenses
  const percentageUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0
  const isOverBudget = totalExpenses > totalBudget

  // Helper function to format currency
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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Budgeting 💰
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Track your monthly expenses and stay within budget
          </p>
        </div>

        {/* Budget Overview Card */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 mb-5 sm:mb-6 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Monthly Budget Overview
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track your spending for this month
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
              isOverBudget 
                ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 shadow-sm shadow-red-500/10' 
                : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/10'
            }`}>
              {isOverBudget ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">
                {isOverBudget ? 'Over Budget' : 'Within Budget'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-light-600 dark:text-dark-400">Budget Usage</span>
              <span className={`text-sm font-bold ${
                isOverBudget 
                  ? 'text-red-600 dark:text-red-400' 
                  : percentageUsed > 80
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {percentageUsed.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-4 bg-light-200 dark:bg-dark-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ease-out relative ${
                  isOverBudget 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : percentageUsed > 80
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-light-500 dark:text-dark-500">
              <span>Rp 0</span>
              <span>Rp {totalBudget.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Budget Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Monthly Budget</span>
              </div>
              <p className="text-2xl font-bold text-light-800 dark:text-dark-100">
                Rp {totalBudget.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Current Expenses</span>
              </div>
              <p className="text-2xl font-bold text-light-800 dark:text-dark-100">
                Rp {totalExpenses.toLocaleString('id-ID')}
              </p>
            </div>
            <div className={`glass-light rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group ${
              remaining < 0 ? 'border-2 border-red-500/50 bg-red-50/50 dark:bg-red-500/5' : ''
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                  remaining < 0 
                    ? 'bg-red-100 dark:bg-red-500/20' 
                    : 'bg-green-100 dark:bg-green-500/20'
                }`}>
                  {remaining < 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <span className="text-xs font-medium text-light-600 dark:text-dark-400">Remaining</span>
              </div>
              <p className={`text-2xl font-bold ${
                remaining < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-light-800 dark:text-dark-100'
              }`}>
                Rp {Math.abs(remaining).toLocaleString('id-ID')}
                {remaining < 0 && <span className="text-sm ml-1">over</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-light-800 dark:text-dark-100 mb-2">
                Select Month & Year
              </h3>
              <div className="flex gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-light-300 dark:border-dark-700 bg-light-50 dark:bg-dark-900 text-light-800 dark:text-dark-200"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-light-300 dark:border-dark-700 bg-light-50 dark:bg-dark-900 text-light-800 dark:text-dark-200"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Budget
            </button>
          </div>
        </div>

        {/* Budget Categories */}
        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Budget by Category
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track spending across different categories
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
              <p className="text-light-500 dark:text-dark-500 text-sm">Loading budgets...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
                No budget categories set up yet
              </p>
              <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
                Create categories to better track your spending
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                Create Category
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const categoryExpenses = transactions
                  .filter(t => t.type === 'expense' && t.category === budget.category)
                  .reduce((sum, t) => sum + t.amount, 0)
                const categoryPercentage = budget.amount > 0 ? (categoryExpenses / budget.amount) * 100 : 0
                const isOverCategoryBudget = categoryExpenses > budget.amount
                
                return (
                  <div
                    key={budget.id}
                    className="glass-light rounded-xl p-4 sm:p-5 border border-light-200 dark:border-dark-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-light-800 dark:text-dark-100 mb-1">
                          {budget.category}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-light-500 dark:text-dark-500">
                          <span>Budget: {formatCurrency(budget.amount)}</span>
                          <span>Spent: {formatCurrency(categoryExpenses)}</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('Hapus budget ini?')) {
                            try {
                              await apiClient.deleteBudget(budget.id)
                              toast.success('Budget berhasil dihapus!')
                              fetchData()
                            } catch (error: any) {
                              toast.error(error.message || 'Gagal menghapus budget')
                            }
                          }
                        }}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-full h-2 bg-light-200 dark:bg-dark-700 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all ${
                          isOverCategoryBudget
                            ? 'bg-red-500'
                            : categoryPercentage > 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(categoryPercentage, 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs font-medium ${
                      isOverCategoryBudget
                        ? 'text-red-600 dark:text-red-400'
                        : categoryPercentage > 80
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {categoryPercentage.toFixed(1)}% used
                      {isOverCategoryBudget && ` (${formatCurrency(categoryExpenses - budget.amount)} over)`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchData()
          setIsAddModalOpen(false)
        }}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />
    </DashboardLayout>
  )
}

function AddBudgetModal({ isOpen, onClose, onSuccess, defaultMonth, defaultYear }: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultMonth: number
  defaultYear: number
}) {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    budget_month: defaultMonth,
    budget_year: defaultYear,
  })
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    setFormData(prev => ({ ...prev, budget_month: defaultMonth, budget_year: defaultYear }))
  }, [defaultMonth, defaultYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.createBudget({
        category: formData.category,
        amount: parseFloat(formData.amount),
        budget_month: formData.budget_month,
        budget_year: formData.budget_year,
      })
      toast.success('Budget berhasil ditambahkan! 🎉')
      onSuccess()
      setFormData({
        category: '',
        amount: '',
        budget_month: defaultMonth,
        budget_year: defaultYear,
      })
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Budget">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category"
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Food, Transport, Entertainment"
          required
        />
        <Input
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="5000000"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
              Month
            </label>
            <select
              value={formData.budget_month}
              onChange={(e) => setFormData({ ...formData, budget_month: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-light-300 dark:border-dark-700 bg-light-50 dark:bg-dark-900 text-light-800 dark:text-dark-200"
              required
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
              Year
            </label>
            <select
              value={formData.budget_year}
              onChange={(e) => setFormData({ ...formData, budget_year: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-light-300 dark:border-dark-700 bg-light-50 dark:bg-dark-900 text-light-800 dark:text-dark-200"
              required
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Budget
          </Button>
        </div>
      </form>
    </Modal>
  )
}
