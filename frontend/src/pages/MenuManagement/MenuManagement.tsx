import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import MenuItemForm from '../../components/menu/MenuItemForm/MenuItemForm'
import { menuAPI } from '../../services/menuAPI'
import toast from 'react-hot-toast'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
  image_url?: string
  preparation_time?: number
}

const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    document.title = 'Menu Management - UniOrder'
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true)
      const response = await menuAPI.getMenuItems()
      setMenuItems(response.data || [])
    } catch (error) {
      toast.error('Failed to load menu items')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = () => {
    console.log('handleAddItem called');
    setEditingItem(null)
    setShowForm(true)
    console.log('showForm set to:', true);
  }

  const handleEditItem = (item: MenuItem) => {
    console.log('handleEditItem called with:', item);
    setEditingItem(item)
    setShowForm(true)
    console.log('showForm set to:', true, 'editingItem:', item);
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await menuAPI.deleteMenuItem(id)
      toast.success('Menu item deleted successfully')
      fetchMenuItems()
    } catch (error) {
      toast.error('Failed to delete menu item')
    }
  }

  const handleToggleAvailability = async (id: number, isAvailable: boolean) => {
    try {
      await menuAPI.updateMenuItem(id, { is_available: !isAvailable })
      toast.success(`Item ${!isAvailable ? 'enabled' : 'disabled'} successfully`)
      fetchMenuItems()
    } catch (error) {
      toast.error('Failed to update item availability')
    }
  }

  const categories = ['all', ...new Set(menuItems.map(item => item.category))]
  
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  console.log('MenuManagement render - showForm:', showForm, 'editingItem:', editingItem);
  
  return (
    <div className="space-y-6 container">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Menu Management</h1>
            <p className="text-white opacity-80">Manage your restaurant menu items</p>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              console.log('Add item clicked');
              handleAddItem();
            }} 
            className="btn btn-primary"
            type="button"
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-50" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-50" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input pl-10"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="w-full h-64 bg-white bg-opacity-20 rounded-lg mb-4"></div>
              <div className="h-4 bg-white bg-opacity-20 rounded mb-2"></div>
              <div className="h-3 bg-white bg-opacity-20 rounded mb-4"></div>
              <div className="h-8 bg-white bg-opacity-20 rounded"></div>
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center">
            <p className="text-white opacity-70">No menu items found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="glass-card p-6 group">
              {/* Item Image */}
              <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{width: '100%', height: '256px', objectFit: 'cover'}}
                    className="transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                    <span className="text-white opacity-50 text-sm">No Image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`badge ${item.is_available ? 'status-ready' : 'status-cancelled'}`}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Item Details */}
              <div className="space-y-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  <p className="text-sm text-white opacity-70 line-clamp-2">{item.description}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold" style={{background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                    ${item.price}
                  </span>
                  <span className="badge status-preparing">{item.category}</span>
                </div>

                {item.preparation_time && (
                  <div className="text-sm text-white opacity-60">
                    Prep time: {item.preparation_time} min
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Edit clicked for:', item.name);
                      handleEditItem(item);
                    }}
                    className="btn btn-primary flex-1"
                    type="button"
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleAvailability(item.id, item.is_available)}
                    className={`btn ${item.is_available ? 'btn-warning' : 'btn-success'}`}
                  >
                    {item.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="btn btn-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <div 
            className="glass-card"
            style={{
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'white' }}
              >
                ×
              </button>
            </div>
            <MenuItemForm
              item={editingItem || undefined}
              onSubmit={(savedItem) => {
                setShowForm(false)
                fetchMenuItems()
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuManagement