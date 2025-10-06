import React, { useState } from 'react';
import { menuAPI, MenuItem, CreateMenuItemData } from '../../../services/menuAPI';
import Button from '../../ui/Button/Button';
import Input from '../../ui/Input/Input';
import toast from 'react-hot-toast';

interface MenuItemFormProps {
  item?: MenuItem;
  onSubmit: (item: MenuItem) => void;
  onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ item, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateMenuItemData>({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || '',
    is_available: item?.is_available ?? true,
    image_url: item?.image_url || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(item?.image_url || '');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let finalFormData: any = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        is_available: formData.is_available
      };
      
      // Add image_url if provided (allow any valid URL)
      if (formData.image_url && formData.image_url.trim() !== '') {
        finalFormData.image_url = formData.image_url.trim();
      }
      
      console.log('Submitting form data:', JSON.stringify(finalFormData, null, 2));
      
      let response;
      if (item) {
        response = await menuAPI.updateMenuItem(item.id, finalFormData);
      } else {
        response = await menuAPI.createMenuItem(finalFormData);
      }
      
      if (response.success) {
        toast.success(item ? 'Menu item updated successfully' : 'Menu item created successfully');
        onSubmit(response.data);
      } else {
        toast.error('Failed to save menu item');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateMenuItemData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-group">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="Enter item name"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="form-input"
          placeholder="Enter item description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <Input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            error={errors.price}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <Input
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            error={errors.category}
            placeholder="Enter category"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Image</label>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                  setImagePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
                // Don't clear URL field, keep it for reference
              }
            }}
            className="form-input"
          />
          <Input
            label="Or enter image URL"
            type="url"
            value={formData.image_url}
            onChange={(e) => {
              handleChange('image_url', e.target.value);
              setImagePreview(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
          />
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                style={{width: '100%', height: '256px', objectFit: 'cover'}}
                className="rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <div className="flex items-center">
          <input
            id="is_available"
            type="checkbox"
            checked={formData.is_available}
            onChange={(e) => handleChange('is_available', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_available" className="ml-2 block text-sm text-white">
            Available for ordering
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {item ? 'Update Item' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
};

export default MenuItemForm;