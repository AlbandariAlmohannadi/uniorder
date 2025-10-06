import React, { useState } from 'react'
import { X, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConnectAppModalProps {
  isOpen: boolean
  onClose: () => void
  platform: string
  onConnect: (platform: string, credentials: any) => Promise<void>
}

const ConnectAppModal: React.FC<ConnectAppModalProps> = ({
  isOpen,
  onClose,
  platform,
  onConnect
}) => {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey || !webhookSecret) {
      toast.error('API Key and Webhook Secret are required')
      return
    }

    setIsConnecting(true)
    try {
      await onConnect(platform, {
        apiKey,
        apiSecret,
        webhookSecret
      })
      handleClose()
      toast.success(`${platform} connected successfully`)
    } catch (error) {
      toast.error(`Failed to connect ${platform}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleClose = () => {
    setApiKey('')
    setApiSecret('')
    setWebhookSecret('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div className="glass-card p-6 w-full max-w-md" style={{position: 'relative', zIndex: 10000, margin: '20px'}}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="stats-icon" style={{width: '40px', height: '40px', marginBottom: 0}}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Connect {platform}
              </h3>
              <p className="text-sm text-white opacity-70">Configure platform integration</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label text-white">
                API Key *
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="form-input"
                placeholder="Enter your API key"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label text-white">
                API Secret (Optional)
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="form-input"
                placeholder="Enter your API secret"
              />
            </div>

            <div className="form-group">
              <label className="form-label text-white">
                Webhook Secret *
              </label>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="form-input"
                placeholder="Enter webhook secret"
                required
              />
            </div>

            <div className="glass-card p-3">
              <p className="text-xs text-white opacity-80">
                <strong>Webhook URL:</strong> https://your-domain.com/api/integrations/{platform.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline flex-1"
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <div className="loading-spinner"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConnectAppModal