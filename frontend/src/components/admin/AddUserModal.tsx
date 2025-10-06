import React, { useState } from 'react'
import { X, User, Mail, Shield, Lock, UserPlus } from 'lucide-react'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onAddUser: (userData: { username: string; email: string; role: string; password: string }) => void
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'employee',
    password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.username && formData.email && formData.password) {
      onAddUser(formData)
      setFormData({ username: '', email: '', role: 'employee', password: '' })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[9999]" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div className="glass-card w-full max-w-2xl border border-white border-opacity-30 shadow-2xl" style={{position: 'relative', zIndex: 10000, margin: '20px', padding: '2rem'}}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Add New User</h2>
          <p className="text-white opacity-80">Create a new system user account with role-based access</p>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white opacity-70 hover:opacity-100 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username Field */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span>Username</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="modal-form-input w-full rounded-xl focus:outline-none transition-all backdrop-blur-sm"
                placeholder="Enter username"
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-green-400" />
                  <span>Email Address</span>
                </div>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="modal-form-input w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Field */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span>User Role</span>
                </div>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="modal-form-select w-full rounded-xl focus:outline-none transition-all backdrop-blur-sm"
              >
                <option value="employee">Employee - Basic access</option>
                <option value="manager">Manager - Order management</option>
                <option value="admin">Admin - Full system access</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-orange-400" />
                  <span>Password</span>
                </div>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="modal-form-input w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="Enter secure password"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-white border-opacity-30 rounded-xl text-white font-medium hover:bg-white hover:bg-opacity-10 transition-all backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 border border-white border-opacity-30 rounded-xl text-white font-medium hover:bg-white hover:bg-opacity-10 transition-all backdrop-blur-sm flex items-center justify-center space-x-2"
            >
              <UserPlus className="h-5 w-5" />
              <span>Create User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUserModal