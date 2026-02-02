'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Wallet, Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import AddWalletModal from '@/components/wallets/AddWalletModal'
import EditWalletModal from '@/components/wallets/EditWalletModal'
import { apiClient, Account } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'


export default function WalletsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAccounts()
      setAccounts(response)
    } catch (error: any) {
      console.error('Error fetching accounts:', error)
      toast.error(error.message || 'Gagal memuat accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleAddSuccess = () => {
    fetchAccounts()
  }

  const handleEdit = (account: Account) => {
    setSelectedAccount(account)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    await fetchAccounts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus account ini?')) {
      return
    }

    try {
      setDeletingId(id)
      await apiClient.deleteAccount(id)
      toast.success('Account berhasil dihapus! 🗑️')
      fetchAccounts()
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Gagal menghapus account')
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

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      cash: 'Cash',
      bank: 'Bank',
      wallet: 'Wallet',
      paylater: 'PayLater',
    }
    return types[type] || type
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Wallets 💳
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Manage your wallets and accounts
          </p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Your Wallets
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Track balances across different accounts
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Wallet</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
              <p className="text-light-500 dark:text-dark-500 text-sm">Loading wallets...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
                No wallets yet
              </p>
              <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
                Add your first wallet to start tracking your finances
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                Add Your First Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {accounts.map((account) => {
                return (
                <div
                  key={account.id}
                  className="rounded-xl p-4 sm:p-6 border border-light-200 dark:border-dark-800 transition-all duration-200 hover:shadow-lg relative group overflow-hidden glass-light"
                >
                  {/* Account Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center text-2xl">
                        💳
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100">
                          {account.name}
                        </h3>
                        <p className="text-xs text-light-500 dark:text-dark-500">
                          {getAccountTypeLabel(account.type)} • {account.currency}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-xs text-light-500 dark:text-dark-500 mb-1">
                      Balance
                    </p>
                    <p className={`text-xl sm:text-2xl font-bold ${
                      account.balance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-light-800 dark:text-dark-100'
                    }`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-light-200 dark:border-dark-800">
                    <button
                      onClick={() => handleEdit(account)}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={deletingId === account.id}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === account.id ? (
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
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      <EditWalletModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedAccount(null)
        }}
        wallet={selectedAccount as any}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  )
}

