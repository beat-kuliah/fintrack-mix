'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowUpRight, ArrowDownRight, Calendar, Tag, ChevronDown, Wallet } from 'lucide-react'
import { apiClient, Transaction, Account, Budget } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onSuccess?: () => void
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: EditTransactionModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: '',
    type: 'expense' as 'income' | 'expense',
    account_id: '',
  })
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [budgetCategories, setBudgetCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true)
      const response = await apiClient.getAccounts()
      setAccounts(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    } finally {
      setIsLoadingAccounts(false)
    }
  }, [])

  // Fetch budget categories for expense transactions
  const fetchBudgetCategories = useCallback(async () => {
    if (formData.type !== 'expense') return
    
    try {
      setIsLoadingCategories(true)
      const transactionDate = formData.date ? new Date(formData.date) : new Date()
      const month = transactionDate.getMonth() + 1
      const year = transactionDate.getFullYear()
      
      const budgets = await apiClient.getBudgets({ month, year })
      const categories = budgets.map(b => b.category).filter((cat, index, self) => self.indexOf(cat) === index)
      setBudgetCategories(categories)
    } catch (error) {
      console.error('Error fetching budget categories:', error)
      setBudgetCategories([])
    } finally {
      setIsLoadingCategories(false)
    }
  }, [formData.type, formData.date])

  // Fetch accounts and budget categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAccounts()
      if (formData.type === 'expense') {
        fetchBudgetCategories()
      }
    }
  }, [isOpen, fetchAccounts, formData.type, fetchBudgetCategories])
  
  // Re-fetch budget categories when date or type changes
  useEffect(() => {
    if (isOpen && formData.type === 'expense' && formData.date) {
      fetchBudgetCategories()
    }
  }, [formData.date, formData.type, isOpen, fetchBudgetCategories])

  // Load transaction data when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      setIsLoading(true)
      // Format date from transaction_date (YYYY-MM-DD format)
      const dateValue = transaction.transaction_date 
        ? new Date(transaction.transaction_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        category: transaction.category || '',
        date: dateValue,
        type: transaction.type,
        account_id: transaction.account_id || '',
      })
      setIsLoading(false)
    }
  }, [isOpen, transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    setIsSubmitting(true)

    try {
      await apiClient.updateTransaction(transaction.id, {
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        category: formData.category || undefined,
        transaction_date: formData.date,
        type: formData.type,
        account_id: formData.account_id || undefined,
      })

      toast.success('Transaksi berhasil diupdate! ✨')
      onClose()

      // Call onSuccess callback if provided, otherwise reload page
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error updating transaction:', error)
      toast.error(error.message || 'Gagal mengupdate transaksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Build categories: for expense, combine budget categories with defaults
  const defaultExpenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
  const defaultIncomeCategories = ['Initial', 'Salary', 'Freelance', 'Investment', 'Bonus', 'Other']
  
  const categories = formData.type === 'income'
    ? defaultIncomeCategories
    : (() => {
        // Combine budget categories with defaults, remove duplicates, prioritize budget categories
        const combined = [...budgetCategories, ...defaultExpenseCategories]
        const unique = combined.filter((cat, index, self) => self.indexOf(cat) === index)
        return unique
      })()

  if (!transaction) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${formData.type === 'income' ? 'Income' : 'Expense'}`}
      size="md"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-light-600 dark:text-dark-400">Loading transaction data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wallet Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-light-700 dark:text-dark-300 mb-1.5 sm:mb-2">
              Account
              <span className="text-primary-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 z-10">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              {isLoadingAccounts ? (
                <div className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-500 dark:text-dark-400">
                  Loading accounts...
                </div>
              ) : (
                <>
                  <select
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.icon || '💳'} {account.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-light-700 dark:text-dark-300 mb-1.5 sm:mb-2">
              Transaction Type
              <span className="text-primary-500 ml-1">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Amount */}
          <Input
            label="Amount (Rp)"
            type="number"
            name="amount"
            placeholder="0"
            value={formData.amount}
            onChange={handleChange}
            required
            icon={
              formData.type === 'income' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              )
            }
          />

          {/* Description */}
          <Input
            label="Description"
            type="text"
            name="description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          {/* Category */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-light-700 dark:text-dark-300 mb-1.5 sm:mb-2">
              Category
              <span className="text-primary-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 z-10">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
              >
                <option value="">Select category</option>
                {formData.type === 'expense' && budgetCategories.length > 0 && (
                  <optgroup label="💰 Budget Categories">
                    {budgetCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={formData.type === 'expense' ? '📋 Default Categories' : 'Categories'}>
                  {(formData.type === 'expense' ? defaultExpenseCategories : defaultIncomeCategories)
                    .filter(cat => formData.type === 'expense' ? !budgetCategories.includes(cat) : true)
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </optgroup>
              </select>
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 pointer-events-none">
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Date */}
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            icon={<Calendar className="w-4 h-4 text-light-500 dark:text-dark-400" />}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={isSubmitting}
            >
              Update Transaction
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}


