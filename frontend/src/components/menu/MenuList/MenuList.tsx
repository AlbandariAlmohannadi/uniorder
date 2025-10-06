import React, { useState, useEffect } from 'react';
import { menuAPI, MenuItem } from '../../../services/menuAPI';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Button from '../../ui/Button/Button';
import Modal from '../../ui/Modal/Modal';
import MenuItemForm from '../MenuItemForm/MenuItemForm';
import toast from 'react-hot-toast';

const MenuList: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    is_available: '',
    search: ''
  });

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getMenuItems(filters);
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const response = await menuAPI.toggleAvailability(item.id, !item.is_available);
      if (response.success) {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, is_available: !i.is_available } : i
        ));
        toast.success(`Item ${!item.is_available ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to update item availability');
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await menuAPI.deleteMenuItem(item.id);
      if (response.success) {
        setItems(prev => prev.filter(i => i.id !== item.id));
        toast.success('Item deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleFormSubmit = (updatedItem: MenuItem) => {
    if (selectedItem) {
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    } else {
      setItems(prev => [...prev, updatedItem]);
    }
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const categories = [...new Set(items.map(item => item.category))];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
        <Button onClick={() => setShowForm(true)}>
          Add New Item
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="form-input"
          />
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="form-input"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={filters.is_available}
            onChange={(e) => setFilters(prev => ({ ...prev, is_available: e.target.value }))}
            className="form-input"
          >
            <option value="">All Items</option>
            <option value="true">Available Only</option>
            <option value="false">Unavailable Only</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="glass-card">
              <div className="p-6">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(item.price)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="badge bg-gray-100 text-gray-800">
                    {item.category}
                  </span>
                  <span className={`badge ${item.is_available ? 'badge-success' : 'badge-danger'}`}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowForm(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={item.is_available ? 'warning' : 'success'}
                    onClick={() => handleToggleAvailability(item)}
                  >
                    {item.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        title={selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        size="lg"
      >
        <MenuItemForm
          item={selectedItem || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
};

export default MenuList;