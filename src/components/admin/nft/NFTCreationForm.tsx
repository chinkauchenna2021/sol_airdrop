// /components/admin/nft/NFTCreationForm.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, LinkIcon, Trash2, ImageIcon, Loader, 
  Save, AlertTriangle 
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NFTMetadata {
  name: string
  symbol: string
  description: string
  uri: string
  attributes: { trait_type: string; value: string }[]
}

interface NFTCreationFormProps {
  onNFTCreated: (nft: any) => void
  initialSupply: number
  mintingEnabled: boolean
  loading: boolean
  onSubmit: (metadata: NFTMetadata) => Promise<void>
}

export function NFTCreationForm({ 
  onNFTCreated, 
  initialSupply, 
  mintingEnabled, 
  loading,
  onSubmit 
}: NFTCreationFormProps) {
  const [metadata, setMetadata] = useState<NFTMetadata>({
    name: '',
    symbol: '',
    description: '',
    uri: '',
    attributes: []
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!metadata.name.trim()) errors.name = 'Collection name is required'
    if (!metadata.symbol.trim()) errors.symbol = 'Symbol is required'
    if (!metadata.uri.trim()) errors.uri = 'Metadata URI is required'
    
    if (metadata.symbol.length > 10) errors.symbol = 'Symbol must be 10 characters or less'
    
    try {
      new URL(metadata.uri)
    } catch {
      if (metadata.uri.trim()) errors.uri = 'Please enter a valid URL'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    await onSubmit(metadata)
    
    // Reset form on success
    setMetadata({
      name: '',
      symbol: '',
      description: '',
      uri: '',
      attributes: []
    })
    setValidationErrors({})
  }

  const addAttribute = () => {
    setMetadata(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }))
  }

  const removeAttribute = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }))
  }

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }))
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <ImageIcon className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-semibold text-white">Create NFT Collection</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                value={metadata.name}
                onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 ${
                  validationErrors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter collection name"
                disabled={!mintingEnabled || loading}
              />
              {validationErrors.name && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Symbol *
              </label>
              <input
                type="text"
                value={metadata.symbol}
                onChange={(e) => setMetadata(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 ${
                  validationErrors.symbol ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="NFT"
                maxLength={10}
                disabled={!mintingEnabled || loading}
              />
              {validationErrors.symbol && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.symbol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Metadata URI *
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={metadata.uri}
                  onChange={(e) => setMetadata(prev => ({ ...prev, uri: e.target.value }))}
                  className={`w-full bg-gray-700 border rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-green-500 ${
                    validationErrors.uri ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="https://arweave.net/..."
                  disabled={!mintingEnabled || loading}
                />
              </div>
              {validationErrors.uri && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.uri}</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 resize-none"
                rows={4}
                placeholder="Describe your NFT collection..."
                disabled={!mintingEnabled || loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Initial Supply
              </label>
              <input
                type="number"
                value={initialSupply}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500"
                min="1"
                disabled={true}
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Controlled by admin settings
              </p>
            </div>
          </div>
        </div>

        {/* Attributes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">
              Attributes (Optional)
            </label>
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              disabled={!mintingEnabled || loading}
            >
              <Plus className="w-4 h-4" />
              Add Attribute
            </button>
          </div>
          
          <div className="space-y-2">
            {metadata.attributes.map((attr, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500"
                  placeholder="Trait Type"
                  disabled={!mintingEnabled || loading}
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500"
                  placeholder="Value"
                  disabled={!mintingEnabled || loading}
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  disabled={!mintingEnabled || loading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            type="submit"
            disabled={loading || !mintingEnabled}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create NFT Collection
              </>
            )}
          </button>
        </div>
      </form>

      {/* Disabled State Warning */}
      {!mintingEnabled && (
        <div className="mt-4 p-3 bg-red-600/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm font-medium">
              NFT minting is currently disabled by admin settings
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
