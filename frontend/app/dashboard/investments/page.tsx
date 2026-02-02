'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Coins, Plus, Edit2, Trash2, Loader2, TrendingUp, TrendingDown, Package } from 'lucide-react'
import { apiClient, GoldAsset, GoldSummary, GoldPrice } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<GoldAsset[]>([])
  const [summary, setSummary] = useState<GoldSummary | null>(null)
  const [currentPrice, setCurrentPrice] = useState<GoldPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<GoldAsset | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [assetsData, summaryData, priceData] = await Promise.all([
        apiClient.getGoldAssets(),
        apiClient.getGoldSummary(),
        apiClient.getGoldPrice().catch(() => null),
      ])
      setAssets(assetsData)
      setSummary(summaryData)
      setCurrentPrice(priceData)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddSuccess = () => {
    fetchData()
    setIsAddModalOpen(false)
  }

  const handleEdit = (asset: GoldAsset) => {
    setSelectedAsset(asset)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus asset ini?')) {
      return
    }

    try {
      setDeletingId(id)
      await apiClient.deleteGoldAsset(id)
      toast.success('Asset berhasil dihapus! 🗑️')
      fetchData()
    } catch (error: any) {
      console.error('Error deleting asset:', error)
      toast.error(error.message || 'Gagal menghapus asset')
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  const getGoldTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      antam: 'Antam',
      ubs: 'UBS',
      galeri24: 'Galeri 24',
      pegadaian: 'Pegadaian',
      other: 'Lainnya',
    }
    return types[type] || type
  }

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-light-800 dark:text-dark-100 mb-1.5 sm:mb-2">
            Gold Investments 🪙
          </h1>
          <p className="text-xs sm:text-sm text-light-600 dark:text-dark-400">
            Track your gold assets and investment performance
          </p>
        </div>

        {/* Summary Cards */}
        {!loading && summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-primary-200 dark:border-primary-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                    Total Weight
                  </span>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">
                {summary.total_weight_gram.toFixed(2)} g
              </p>
            </div>

            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                    Purchase Value
                  </span>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.total_purchase_value)}
              </p>
            </div>

            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-green-200 dark:border-green-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                    Current Value
                  </span>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.total_current_value)}
              </p>
            </div>

            <div className={`glass rounded-xl sm:rounded-2xl p-4 sm:p-5 border ${
              summary.total_profit_loss >= 0
                ? 'border-green-200 dark:border-green-800/50'
                : 'border-red-200 dark:border-red-800/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                    summary.total_profit_loss >= 0
                      ? 'bg-green-500/10 dark:bg-green-500/20'
                      : 'bg-red-500/10 dark:bg-red-500/20'
                  }`}>
                    {summary.total_profit_loss >= 0 ? (
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400">
                    Profit/Loss
                  </span>
                </div>
              </div>
              <p className={`text-lg sm:text-xl font-bold ${
                summary.total_profit_loss >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {summary.total_profit_loss >= 0 ? '+' : ''}
                {formatCurrency(summary.total_profit_loss)}
              </p>
              <p className={`text-xs mt-1 ${
                summary.total_profit_loss >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ({summary.profit_loss_percent >= 0 ? '+' : ''}
                {summary.profit_loss_percent.toFixed(2)}%)
              </p>
            </div>
          </div>
        )}

        {/* Current Price */}
        {currentPrice && (
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 border border-yellow-200 dark:border-yellow-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-light-500 dark:text-dark-500 mb-1">Current Gold Price</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(currentPrice.price_per_gram)} / gram
                </p>
                <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
                  Updated: {formatDate(currentPrice.price_date)}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center">
                <Coins className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                Your Gold Assets
              </h2>
              <p className="text-xs text-light-500 dark:text-dark-500">
                Manage your gold investments
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Asset</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary-500" />
              <p className="text-light-500 dark:text-dark-500 text-sm">Loading assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-10 sm:py-12 lg:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-100 dark:bg-dark-800 flex items-center justify-center">
                <Coins className="w-8 h-8 text-light-400 dark:text-dark-600" />
              </div>
              <p className="text-light-500 dark:text-dark-500 text-sm font-medium mb-2">
                No gold assets yet
              </p>
              <p className="text-light-400 dark:text-dark-600 text-xs mb-4">
                Add your first gold asset to start tracking
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                Add Your First Asset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {assets.map((asset) => {
                const isProfit = (asset.profit_loss || 0) >= 0
                
                return (
                  <div
                    key={asset.id}
                    className="rounded-xl p-4 sm:p-6 border border-light-200 dark:border-dark-800 transition-all duration-200 hover:shadow-lg relative overflow-hidden"
                  >
                    {/* Asset Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-light-800 dark:text-dark-100 mb-1">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-light-500 dark:text-dark-500">
                          {getGoldTypeLabel(asset.gold_type)}
                        </p>
                      </div>
                    </div>

                    {/* Asset Details */}
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-light-500 dark:text-dark-500">Weight:</span>
                        <span className="text-light-700 dark:text-dark-300 font-medium">
                          {asset.weight_gram.toFixed(2)} g
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-light-500 dark:text-dark-500">Purchase Price:</span>
                        <span className="text-light-700 dark:text-dark-300 font-medium">
                          {formatCurrency(asset.purchase_price_per_gram)} / g
                        </span>
                      </div>
                      {asset.current_price_per_gram && (
                        <div className="flex justify-between text-xs">
                          <span className="text-light-500 dark:text-dark-500">Current Price:</span>
                          <span className="text-light-700 dark:text-dark-300 font-medium">
                            {formatCurrency(asset.current_price_per_gram)} / g
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-light-500 dark:text-dark-500">Purchase Date:</span>
                        <span className="text-light-700 dark:text-dark-300 font-medium">
                          {formatDate(asset.purchase_date)}
                        </span>
                      </div>
                      {asset.purchase_value && (
                        <div className="flex justify-between text-xs">
                          <span className="text-light-500 dark:text-dark-500">Purchase Value:</span>
                          <span className="text-light-700 dark:text-dark-300 font-medium">
                            {formatCurrency(asset.purchase_value)}
                          </span>
                        </div>
                      )}
                      {asset.current_value && (
                        <div className="flex justify-between text-xs">
                          <span className="text-light-500 dark:text-dark-500">Current Value:</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(asset.current_value)}
                          </span>
                        </div>
                      )}
                      {asset.profit_loss !== undefined && (
                        <div className="pt-2 border-t border-light-200 dark:border-dark-800">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-light-500 dark:text-dark-500">Profit/Loss:</span>
                            <span className={`text-sm font-bold ${
                              isProfit
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isProfit ? '+' : ''}
                              {formatCurrency(asset.profit_loss)}
                            </span>
                          </div>
                          {asset.profit_loss_percent !== undefined && (
                            <p className={`text-xs text-right mt-1 ${
                              isProfit
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              ({isProfit ? '+' : ''}
                              {asset.profit_loss_percent.toFixed(2)}%)
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-light-200 dark:border-dark-800">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-light-600 dark:text-dark-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        disabled={deletingId === asset.id}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === asset.id ? (
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
      <AddGoldAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Modal */}
      {selectedAsset && (
        <EditGoldAssetModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedAsset(null)
          }}
          asset={selectedAsset}
          onSuccess={handleAddSuccess}
        />
      )}
    </DashboardLayout>
  )
}

function AddGoldAssetModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    gold_type: 'antam' as 'antam' | 'ubs' | 'galeri24' | 'pegadaian' | 'other',
    weight_gram: '',
    purchase_price_per_gram: '',
    purchase_date: '',
    storage_location: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.createGoldAsset({
        name: formData.name,
        gold_type: formData.gold_type,
        weight_gram: parseFloat(formData.weight_gram),
        purchase_price_per_gram: parseFloat(formData.purchase_price_per_gram),
        purchase_date: formData.purchase_date,
        storage_location: formData.storage_location,
        notes: formData.notes,
      })
      toast.success('Gold asset berhasil ditambahkan! 🎉')
      onSuccess()
      setFormData({
        name: '',
        gold_type: 'antam',
        weight_gram: '',
        purchase_price_per_gram: '',
        purchase_date: '',
        storage_location: '',
        notes: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan asset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Gold Asset">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Asset Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Antam 10g"
          required
        />
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Gold Type
          </label>
          <select
            value={formData.gold_type}
            onChange={(e) => setFormData({ ...formData, gold_type: e.target.value as any })}
            className="w-full px-4 py-2 rounded-lg border border-light-300 dark:border-dark-700 bg-light-50 dark:bg-dark-900 text-light-800 dark:text-dark-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="antam">Antam</option>
            <option value="ubs">UBS</option>
            <option value="galeri24">Galeri 24</option>
            <option value="pegadaian">Pegadaian</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <Input
          label="Weight (grams)"
          type="number"
          step="0.01"
          value={formData.weight_gram}
          onChange={(e) => setFormData({ ...formData, weight_gram: e.target.value })}
          placeholder="10.00"
          required
        />
        <Input
          label="Purchase Price per Gram"
          type="number"
          step="0.01"
          value={formData.purchase_price_per_gram}
          onChange={(e) => setFormData({ ...formData, purchase_price_per_gram: e.target.value })}
          placeholder="1000000"
          required
        />
        <Input
          label="Purchase Date"
          type="date"
          value={formData.purchase_date}
          onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
          required
        />
        <Input
          label="Storage Location (optional)"
          type="text"
          value={formData.storage_location}
          onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
          placeholder="e.g., Safe at home"
        />
        <div>
          <label className="block text-sm font-medium text-light-700 dark:text-dark-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-light-300 dark:border-dark-700 bg-light-50 dark:bg-dark-900 text-light-800 dark:text-dark-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Asset
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditGoldAssetModal({ isOpen, onClose, asset, onSuccess }: { isOpen: boolean; onClose: () => void; asset: GoldAsset; onSuccess: () => void }) {
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Note: Backend doesn't have update endpoint, so we'll just show a message
    toast.info('Update feature coming soon! For now, please delete and recreate the asset.')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Gold Asset">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-light-600 dark:text-dark-400">
          Update feature coming soon. Please delete and recreate the asset for now.
        </p>
        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Close
          </Button>
        </div>
      </form>
    </Modal>
  )
}
