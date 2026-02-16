'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Wallet } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { apiClient, Account } from '@/lib/api'

interface EditWalletModalProps {
  isOpen: boolean
  onClose: () => void
  wallet: Account | null
  onSuccess?: () => void
}


export default function EditWalletModal({
  isOpen,
  onClose,
  wallet,
  onSuccess,
}: EditWalletModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    currency: 'IDR',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (wallet) {
      setFormData({
        name: wallet.name,
        currency: wallet.currency || 'IDR',
      })
    }
  }, [wallet])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet) return

    setIsSubmitting(true)

    try {
      await apiClient.updateAccount(wallet.id, {
        name: formData.name,
        currency: formData.currency,
      })


      toast.success('Wallet berhasil diperbarui! ✅')
      
      // Close modal first
      onClose()

      // Then refresh data
      if (onSuccess) {
        // Add small delay to ensure modal is closed before refresh
        setTimeout(() => {
          onSuccess()
        }, 100)
      }
    } catch (error: any) {
      console.error('Error updating wallet:', error)
      toast.error(error.message || 'Gagal memperbarui wallet')
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

  if (!wallet) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Wallet"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <Input
            label="Wallet Name"
            type="text"
            name="name"
            placeholder="e.g., Main Wallet, Savings"
            value={formData.name}
            onChange={handleChange}
            required
            icon={<Wallet className="w-4 h-4 text-light-500 dark:text-dark-400" />}
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Currency
            <span className="text-primary-500 ml-1">*</span>
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-light-300 dark:border-dark-700 bg-light-100 dark:bg-dark-800/50 text-light-800 dark:text-dark-100 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors"
            required
          >
            <option value="IDR">IDR - Indonesian Rupiah</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="SGD">SGD - Singapore Dollar</option>
            <option value="MYR">MYR - Malaysian Ringgit</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CNY">CNY - Chinese Yuan</option>
          </select>
          <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
            Pilih mata uang untuk account ini
          </p>
        </div>

        {/* Balance Info - Read Only */}
        {wallet && (
          <div className="p-4 rounded-lg bg-light-100 dark:bg-dark-800/50 border border-light-300 dark:border-dark-700">
            <p className="text-xs text-light-500 dark:text-dark-500 mb-1">Current Balance</p>
            <p className="text-lg font-semibold text-light-800 dark:text-dark-100">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: wallet.currency || 'IDR',
                minimumFractionDigits: 0,
              }).format(wallet.balance)}
            </p>
            <p className="text-xs text-light-400 dark:text-dark-600 mt-1">
              Balance hanya dapat diubah melalui transaksi
            </p>
          </div>
        )}


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
            Update Wallet
          </Button>
        </div>
      </form>
    </Modal>
  )
}

