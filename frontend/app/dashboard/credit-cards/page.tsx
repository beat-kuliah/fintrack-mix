'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { CreditCard as CreditCardIcon, Plus, Edit2, Trash2, Loader2, Calendar, AlertCircle } from 'lucide-react'
import { apiClient, CreditCard } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()

  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCreditCards()
      setCards(response || [])
    } catch (error: any) {
      console.error('Error fetching credit cards:', error)
      toast.error(error.message || 'Gagal memuat credit cards')
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const handleAddSuccess = () => {
    fetchCards()
    setIsAddModalOpen(false)
  }

  const handleEdit = (card: CreditCard) => {
    setSelectedCard(card)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus credit card ini?')) {
      return
    }

    try {
      setDeletingId(id)
      await apiClient.deleteCreditCard(id)
      toast.success('Credit card berhasil dihapus! 🗑️')
      fetchCards()
    } catch (error: any) {
      console.error('Error deleting credit card:', error)
      toast.error(error.message || 'Gagal menghapus credit card')
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCreditUsagePercent = (card: CreditCard) => {
    return (card.current_balance / card.credit_limit) * 100
  }

  const getDaysUntilDue = (dueDate: number) => {
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    let dueDateObj = new Date(currentYear, currentMonth, dueDate)
    if (dueDate < currentDay) {
      dueDateObj = new Date(currentYear, currentMonth + 1, dueDate)
    }
    
    const diffTime = dueDateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Credit Cards 💳
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Manage your credit cards and track spending
          </p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Your Credit Cards
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track balances and payment due dates
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Card</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
              <p className="text-light-500 dark:text-dark-500 text-sm">Loading credit cards...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
                <CreditCardIcon className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
                No credit cards yet
              </p>
              <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
                Add your first credit card to start tracking
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                Add Your First Card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {cards.map((card) => {
                const usagePercent = getCreditUsagePercent(card)
                const daysUntilDue = getDaysUntilDue(card.payment_due_date)
                const availableCredit = card.credit_limit - card.current_balance
                
                return (
                  <div
                    key={card.id}
                    className="rounded-xl p-4 sm:p-6 border border-light-200 dark:border-dark-800 transition-all duration-200 hover:shadow-lg relative overflow-hidden bg-gradient-to-br from-light-50 dark:from-dark-900 to-light-100 dark:to-dark-800"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                          {card.card_name}
                        </h3>
                        <p className="text-xs text-light-500 dark:text-dark-500">
                          **** {card.last_four_digits}
                        </p>
                      </div>
                    </div>

                    {/* Credit Limit & Balance */}
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-light-500 dark:text-dark-500">Credit Limit:</span>
                        <span className="text-light-700 dark:text-dark-300 font-medium">
                          {formatCurrency(card.credit_limit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-light-500 dark:text-dark-500">Used:</span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {formatCurrency(card.current_balance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-light-500 dark:text-dark-500">Available:</span>
                        <span className={`font-medium ${
                          availableCredit < (card.credit_limit * 0.2)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {formatCurrency(availableCredit)}
                        </span>
                      </div>
                      
                      {/* Credit Usage Bar */}
                      <div className="mt-2 h-2 bg-light-200 dark:bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            usagePercent > 80
                              ? 'bg-red-500'
                              : usagePercent > 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-center text-light-500 dark:text-dark-500">
                        {usagePercent.toFixed(1)}% used
                      </p>
                    </div>

                    {/* Payment Info */}
                    <div className="mb-4 pt-4 border-t border-light-200 dark:border-dark-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-light-500 dark:text-dark-500">
                          <Calendar className="w-3 h-3" />
                          Billing Date:
                        </span>
                        <span className="text-light-700 dark:text-dark-300 font-medium">
                          {card.billing_date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-light-500 dark:text-dark-500">
                          <AlertCircle className="w-3 h-3" />
                          Due Date:
                        </span>
                        <span className={`font-medium ${
                          daysUntilDue <= 7
                            ? 'text-red-600 dark:text-red-400'
                            : daysUntilDue <= 14
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {card.payment_due_date} ({daysUntilDue} days)
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-light-200 dark:border-dark-800">
                      <button
                        onClick={() => handleEdit(card)}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        disabled={deletingId === card.id}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === card.id ? (
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AddCreditCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Modal */}
      {selectedCard && (
        <EditCreditCardModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedCard(null)
          }}
          card={selectedCard}
          onSuccess={handleAddSuccess}
        />
      )}
    </DashboardLayout>
  )
}

function AddCreditCardModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    card_name: '',
    last_four_digits: '',
    credit_limit: '',
    current_balance: '',
    billing_date: '',
    payment_due_date: '',
  })
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.createCreditCard({
        card_name: formData.card_name,
        last_four_digits: formData.last_four_digits,
        credit_limit: parseFloat(formData.credit_limit),
        current_balance: formData.current_balance ? parseFloat(formData.current_balance) : 0,
        billing_date: parseInt(formData.billing_date),
        payment_due_date: parseInt(formData.payment_due_date),
      })
      toast.success('Credit card berhasil ditambahkan! 🎉')
      onSuccess()
      setFormData({
        card_name: '',
        last_four_digits: '',
        credit_limit: '',
        current_balance: '',
        billing_date: '',
        payment_due_date: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan credit card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Credit Card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Card Name"
          type="text"
          value={formData.card_name}
          onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
          placeholder="e.g., BCA Visa"
          required
        />
        <Input
          label="Last 4 Digits"
          type="text"
          value={formData.last_four_digits}
          onChange={(e) => setFormData({ ...formData, last_four_digits: e.target.value })}
          placeholder="1234"
          maxLength={4}
          required
        />
        <Input
          label="Credit Limit"
          type="number"
          value={formData.credit_limit}
          onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
          placeholder="5000000"
          required
        />
        <Input
          label="Current Balance (optional)"
          type="number"
          value={formData.current_balance}
          onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
          placeholder="0"
        />
        <Input
          label="Billing Date (1-31)"
          type="number"
          value={formData.billing_date}
          onChange={(e) => setFormData({ ...formData, billing_date: e.target.value })}
          placeholder="15"
          min={1}
          max={31}
          required
        />
        <Input
          label="Payment Due Date (1-31)"
          type="number"
          value={formData.payment_due_date}
          onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
          placeholder="25"
          min={1}
          max={31}
          required
        />
        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Card
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditCreditCardModal({ isOpen, onClose, card, onSuccess }: { isOpen: boolean; onClose: () => void; card: CreditCard; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    card_name: card.card_name,
    last_four_digits: card.last_four_digits,
    credit_limit: card.credit_limit.toString(),
    current_balance: card.current_balance.toString(),
    billing_date: card.billing_date.toString(),
    payment_due_date: card.payment_due_date.toString(),
  })
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Note: Backend doesn't have update endpoint, so we'll just show a message
    toast.info('Update feature coming soon! For now, please delete and recreate the card.')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Credit Card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Card Name"
          type="text"
          value={formData.card_name}
          onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
          required
        />
        <Input
          label="Last 4 Digits"
          type="text"
          value={formData.last_four_digits}
          onChange={(e) => setFormData({ ...formData, last_four_digits: e.target.value })}
          maxLength={4}
          required
        />
        <Input
          label="Credit Limit"
          type="number"
          value={formData.credit_limit}
          onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
          required
        />
        <Input
          label="Current Balance"
          type="number"
          value={formData.current_balance}
          onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
        />
        <Input
          label="Billing Date (1-31)"
          type="number"
          value={formData.billing_date}
          onChange={(e) => setFormData({ ...formData, billing_date: e.target.value })}
          min={1}
          max={31}
          required
        />
        <Input
          label="Payment Due Date (1-31)"
          type="number"
          value={formData.payment_due_date}
          onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
          min={1}
          max={31}
          required
        />
        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Update Card
          </Button>
        </div>
      </form>
    </Modal>
  )
}
