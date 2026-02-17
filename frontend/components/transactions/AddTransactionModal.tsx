'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowUpRight, ArrowDownRight, Calendar, Tag, Wallet, ChevronDown, CreditCard } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { apiClient, Account, Budget, CreditCard as CreditCardType } from '@/lib/api'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  type?: 'income' | 'expense'
  onSuccess?: () => void
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  type = 'expense',
  onSuccess,
}: AddTransactionModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    credit_card_id: '',
  })
  const [accounts, setAccounts] = useState<Account[]>([])
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [budgetCategories, setBudgetCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [accountType, setAccountType] = useState<'account' | 'credit_card'>('account')

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true)
      const [accountsResponse, creditCardsResponse] = await Promise.all([
        apiClient.getAccounts(),
        type === 'expense' ? apiClient.getCreditCards() : Promise.resolve([])
      ])
      setAccounts(accountsResponse)
      setCreditCards(creditCardsResponse)
      // Set first account if available (only if not already set)
      if (accountsResponse.length > 0 && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: accountsResponse[0].id }))
      }
      if (creditCardsResponse.length > 0 && !formData.credit_card_id) {
        setFormData(prev => ({ ...prev, credit_card_id: creditCardsResponse[0].id }))
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setIsLoadingAccounts(false)
    }
  }, [type, accountType])

  // Fetch budget categories for expense transactions
  const fetchBudgetCategories = useCallback(async () => {
    if (type !== 'expense') return
    
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
  }, [type, formData.date])

  // Fetch accounts and budget categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAccounts()
      if (type === 'expense') {
        fetchBudgetCategories()
      }
    }
  }, [isOpen, fetchAccounts, type, fetchBudgetCategories])

  // Reset form when modal closes or account type changes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        account_id: '',
        credit_card_id: '',
      })
      setAccountType('account')
    }
  }, [isOpen])
  
  // Re-fetch budget categories when date changes (for expense)
  useEffect(() => {
    if (isOpen && type === 'expense' && formData.date) {
      fetchBudgetCategories()
    }
  }, [formData.date, isOpen, type, fetchBudgetCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { apiClient } = await import('@/lib/api')
      
      const transactionData: any = {
        type: type,
        category: formData.category || 'Uncategorized',
        amount: parseFloat(formData.amount),
        description: formData.description || '',
        transaction_date: formData.date,
      }

      // Use account_id or credit_card_id based on selection
      if (accountType === 'credit_card' && formData.credit_card_id) {
        transactionData.credit_card_id = formData.credit_card_id
      } else {
        transactionData.account_id = formData.account_id
      }
      
      await apiClient.createTransaction(transactionData)

      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        account_id: accounts.length > 0 ? accounts[0].id : '',
        credit_card_id: creditCards.length > 0 ? creditCards[0].id : '',
      })
      setAccountType('account')
      
      toast.success(type === 'income' ? 'Pendapatan berhasil ditambahkan! 💰' : 'Pengeluaran berhasil ditambahkan! 📝')
      onClose()
      
      // Call onSuccess callback if provided, otherwise reload page
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      toast.error(error.message || 'Gagal menambahkan transaksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'account_type') {
      setAccountType(e.target.value as 'account' | 'credit_card')
      setFormData({
        ...formData,
        account_id: '',
        credit_card_id: '',
      })
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      })
    }
  }

  // Build categories: for expense, combine budget categories with defaults
  // For income, use default categories
  const defaultExpenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
  const defaultIncomeCategories = ['Initial', 'Salary', 'Freelance', 'Investment', 'Bonus', 'Other']
  
  const categories = type === 'income'
    ? defaultIncomeCategories
    : (() => {
        // Combine budget categories with defaults, remove duplicates, prioritize budget categories
        const combined = [...budgetCategories, ...defaultExpenseCategories]
        const unique = combined.filter((cat, index, self) => self.indexOf(cat) === index)
        return unique
      })()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'income' ? 'Add Income' : 'Add Expense'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Type Selection (only for expenses) */}
        {type === 'expense' && (
          <div>
            <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
              Payment Method
              <span className="text-primary-500 ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountType('account')
                  setFormData(prev => ({ ...prev, credit_card_id: '' }))
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  accountType === 'account'
                    ? 'bg-primary-500 text-white'
                    : 'bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300 hover:bg-light-200 dark:hover:bg-dark-700'
                }`}
              >
                <Wallet className="w-4 h-4 inline mr-2" />
                Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('credit_card')
                  setFormData(prev => ({ ...prev, account_id: '' }))
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  accountType === 'credit_card'
                    ? 'bg-primary-500 text-white'
                    : 'bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300 hover:bg-light-200 dark:hover:bg-dark-700'
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                Credit Card
              </button>
            </div>
          </div>
        )}

        {/* Account/Credit Card Selection */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            {accountType === 'credit_card' ? 'Credit Card' : 'Account'}
            <span className="text-primary-500 ml-1">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 z-10">
              {accountType === 'credit_card' ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
            </div>
            {isLoadingAccounts ? (
              <div className="w-full pl-10 pr-10 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-500 dark:text-dark-400">
                Loading {accountType === 'credit_card' ? 'credit cards' : 'accounts'}...
              </div>
            ) : (
              <>
                {accountType === 'credit_card' ? (
                  <select
                    name="credit_card_id"
                    value={formData.credit_card_id}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
                  >
                    <option value="">Select credit card</option>
                    {creditCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        💳 {card.card_name} (****{card.last_four_digits})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600 appearance-none cursor-pointer"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        💳 {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                )}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Amount (Rp)
          </label>
          <Input
            type="number"
            name="amount"
            placeholder="0"
            value={formData.amount}
            onChange={handleChange}
            required
            icon={
              type === 'income' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              )
            }
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Description
          </label>
          <Input
            type="text"
            name="description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Category
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-500 dark:text-dark-400">
              <Tag className="w-4 h-4" />
            </div>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700 rounded-lg sm:rounded-xl text-light-900 dark:text-dark-50 transition-all duration-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-dark-800 hover:border-light-400 dark:hover:border-dark-600"
            >
              <option value="">Select category</option>
              {type === 'expense' && budgetCategories.length > 0 && (
                <optgroup label="💰 Budget Categories">
                  {budgetCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={type === 'expense' ? '📋 Default Categories' : 'Categories'}>
                {(type === 'expense' ? defaultExpenseCategories : defaultIncomeCategories)
                  .filter(cat => type === 'expense' ? !budgetCategories.includes(cat) : true)
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Date
          </label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            icon={<Calendar className="w-4 h-4 text-light-500 dark:text-dark-400" />}
          />
        </div>

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
            {type === 'income' ? 'Add Income' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

